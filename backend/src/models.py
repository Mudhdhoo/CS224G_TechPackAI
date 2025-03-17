from utils.prompts import (SYSTEM_PROMPT_CUSTOMER_AGENT, 
                           SYSTEM_PROMPT_CODE_AGENT,
                           SYSTEM_PROMPT_DRAWING_AGENT,
                           SYSTEM_PROMPT_IMAGE_ANALYSIS_AGENT_CLASSIFICATION,
                           SYSTEM_PROMPT_IMAGE_ANALYSIS_AGENT_SELECTION,
                           GENERATE_DRAWING_PROMPT,
                           SYSTEM_PROMPT_COMBINE_SECTIONS_AGENT)
from loguru import logger
import json
import base64
import os
from utils.compile import compile_latex_from_txt
from utils.utils import load_checkpoint, draw_keypoints, normalize_image, replace_between_markers, DEVICE
from detector.FashionDetector import ViTFashionDetector
from utils.keypoints import augment_upper_body_kpts, extract_keypoints_from_heatmap
import torch
import numpy as np
from PIL import Image
from utils.json_templates import ImageNamesTemplate, FilteredKeypointsTemplate, DrawingCodeTemplate, FullTemplate
from io import BytesIO
from utils.prompts import TEMPLATE

class CustomerAgent:
    def __init__(self, client, code_agent, database, model="gpt-4o"):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_CUSTOMER_AGENT
        self.model = model
        self.code_agent = code_agent
        self.drawing_agent = DrawingSectionAgent(client, model='o1-2024-12-17')
        self.client = client
        self.database = database
        self.reset_conv_history()

        self.functions = [{
            "name": "generate_template",
            "description": "Generate a latex Tech Pack template based on user input.",
            "parameters": {
                "type": "object",
                "properties": {
                    "context": {"type": "string"},
                },
                "required": ["context"]
            }
        }]
        
        self.project_id = None
    
    def chat_stream(self, user_message, project_id, user_id):
        try:
            # Load history from database when restarting or switching to another project
            if self.project_id == None or self.project_id != project_id:
                self.load_conversation_history(project_id, user_id, self.database)
                self.project_id = project_id

            # Add user message to conversation history
            self.conv_history.append({"role":"user", "content": f"{user_message}"})
            # Check for template generation first
            function_completion = self.get_completion()
            message = function_completion.choices[0].message

            if message.function_call and message.function_call.name == "generate_template":
                logger.info("Generating Template")
                # Non-streaming path for function calls
                response, code = self.get_response(message)
                
                compilation_result = None
                if code:
                    # Ensure project directory exists
                    proj_dir = os.path.join(os.getcwd(), 'projects', project_id)
                    os.makedirs(proj_dir, exist_ok=True)
                    
                    # Write LaTeX code to file
                    code_txt_path = os.path.join(proj_dir, "code.txt")
                    logger.info(f"Writing LaTeX code to {code_txt_path}")
                    
                    with open(code_txt_path, "w") as file:
                        file.write(code)
                    
                    # Verify the file was written correctly
                    if not os.path.exists(code_txt_path) or os.path.getsize(code_txt_path) == 0:
                        logger.error(f"Failed to write LaTeX code to {code_txt_path}")
                        response += "\n\nThere was an issue generating your tech pack. The system couldn't save the LaTeX code properly."
                    else:
                        logger.info(f"Compiling LaTeX code at {code_txt_path}")
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        compilation_result = self.compile_latex(os.path.join(current_dir, "projects"), project_id)
                        
                        # Add compilation result feedback to response
                        if compilation_result:
                            response += "\n\nYour tech pack has been updated and a new PDF has been generated. You can view it using the 'Tech Pack Preview' button."
                        else:
                            response += "\n\nThere was an issue generating your tech pack PDF. The system team has been notified."
                
                self.conv_history.append({"role":"assistant", "content":f"{response}"})
                yield response
            else:
                # For regular messages, use streaming
                streaming_completion = self.client.chat.completions.create(
                    model=self.model,
                    temperature=0.7,
                    messages=self.conv_history,
                    stream=True
                )
                
                # Collect the full response to add to history later
                full_response = ""
                
                # Process the streaming response
                for chunk in streaming_completion:
                    if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                        content = chunk.choices[0].delta.content
                        if content:
                            full_response += content
                            yield content

                # Save the complete response to conversation history
                self.conv_history.append({"role":"assistant", "content":f"{full_response}"})
                
        except Exception as e:
            logger.error(f"Error in chat_stream: {str(e)}")
            yield f"Error: {str(e)}"
    
    def get_completion(self):
        completion = self.client.chat.completions.create(
            model=self.model,
            temperature=0.7,
            messages=self.conv_history,
            functions=self.functions,
            function_call="auto",
            stream=False
        )

        return completion
    
    def load_conversation_history(self, project_id, user_id, db):
        """Load previous messages from the database"""
        try:
            logger.info(f"Loading conversation history for project {project_id} and user {user_id}")

            messages = db.get_project_messages(project_id, user_id)

            # Reset conversation history
            self.reset_conv_history()
            
            # Try to load images if they exist
            try:
                illustration_dir = os.path.join(os.getcwd(), "projects", project_id, "illustration")
                if os.path.exists(illustration_dir) and os.listdir(illustration_dir):
                    self.load_image("illustration", project_id)
            except Exception as e:
                logger.error(f"Error loading illustration images: {str(e)}")
                
            try:
                reference_dir = os.path.join(os.getcwd(), "projects", project_id, "reference")
                if os.path.exists(reference_dir) and os.listdir(reference_dir):
                    self.load_image("reference", project_id)
            except Exception as e:
                logger.error(f"Error loading reference images: {str(e)}")

            # Add messages in chronological order 
            for msg in messages[:]:
                if msg["type"] == "assistant":
                    self.conv_history.append({"role": "assistant", "content": msg["content"]})
                elif msg["type"] == "user":
                    self.conv_history.append({"role": "user", "content": msg["content"]})
                
        except Exception as e:
            logger.error(f"Error loading conversation history: {str(e)}")
            raise

    def get_response(self, message):
        code = None
        # Check if code generation is needed
        if message.function_call and message.function_call.name == "generate_template":
            # Generate code
            args = json.loads(message.function_call.arguments)
            code = self.code_agent.generate_template(args["context"])
            # Add code generation result to history
            self.conv_history.append(
                {"role": "developer", "content": "You just generated a tech pack, tell this to the user."}
                )
            
            # Get final response with code explanation
            completion = self.client.chat.completions.create(
                model="gpt-4o",
                messages=self.conv_history,
                temperature=0.7,
                stream = False
            )
            response = completion.choices[0].message.content
        else:
            response = message.content

        return response, code
    
    def reset_conv_history(self):
        self.conv_history =[
                {"role": "developer", "content": self.__SYSTEM_PROMPT}, 
                ]
        
    def load_image(self, type, project_id):
        assert type in ["illustration", "reference"], "type must be illustration or reference"
        images_path = os.path.join(os.getcwd(), "projects", project_id, type)
        
        if not os.path.exists(images_path):
            logger.warning(f"{type} directory does not exist: {images_path}")
            return
            
        image_names = os.listdir(images_path)
        if not image_names:
            logger.warning(f"No {type} images found in {images_path}")
            return
            
        images = [os.path.join(images_path, file) for file in image_names]

        conv = {
                "role": "user",
                "content": [{
                        "type": "text",
                        "text": f"Here are the {type} image(s).\n\
                            <REMEMBER THESE FILE NAMES EXACTLY>\n\
                                The names of these {type} images are {[name for name in image_names]}. These come in the same order as the images.\n\
                            </REMEMBER THESE FILE NAMES EXACTLY> ",
                    }]
                    }
        
        for image in images:
            try:
                with open(image, "rb") as image_file:
                    image_data = base64.b64encode(image_file.read()).decode("utf-8")
                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                    }
                    )
            except Exception as e:
                logger.error(f"Error loading image {image}: {str(e)}")
        
        self.conv_history.append(conv)

    def compile_latex(self, project_path, project_id):
        """
        Compile the LaTeX document for the specified project.
        
        Returns:
            bool: True if compilation succeeded, False otherwise
        """
        try:
            # Validate project directory
            project_dir = os.path.join(project_path, project_id)
            if not os.path.exists(project_dir):
                logger.error(f"Project directory does not exist: {project_dir}")
                return False
                
            # Compile the LaTeX document
            logger.info(f"Compiling LaTeX for project: {project_id}")
            pdf_path = compile_latex_from_txt(project_dir)
            
            if pdf_path and os.path.exists(pdf_path):
                logger.info(f"Successfully compiled PDF: {pdf_path}")
                return True
            else:
                logger.error(f"Failed to compile PDF for project: {project_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error compiling LaTeX: {str(e)}")
            return False

class CodeAgent:
    def __init__(self, client, model="gpt-4o"):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_CODE_AGENT
        self.model = model
        self.drawing_agent = DrawingSectionAgent(client, model="o1-2024-12-17")
        self.combine_sections_agent = CombinedSectionsAgent(client, model="o1-2024-12-17")
        self.client = client
        self.current_template = TEMPLATE
        self.conv_history =[
            {"role": "developer", "content": self.__SYSTEM_PROMPT},     # Provide general instructions and tasks
            ]
        self.conv_history_analyze_context = [
            {'role':"developer", "content": "You will be given some information about a user request for a tech pack. Based on this information, decide if it is necessary to create the FRONT VIEW or BACK VIEW sections. If yes, Call the generate_drawing_section function."}
        ]
        
        self.functions = [{
        "name": "generate_drawing_section",
        "description": "Generate the drawing section of a latex template.",
        "parameters": {
            "type": "object",
            "properties": {
                "context": {"type": "string"},
            },
            "required": ["context"]
        }
         }]
    
    def generate_template(self, context):
        self.conv_history.append({"role":"user", "content": f"{context}"})
        self.conv_history_analyze_context.append({"role":"user", "content": f"{context}"})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.conv_history_analyze_context,
            reasoning_effort="high",
            functions=self.functions,
            function_call="auto",
            stream=False)
        
        self.reset_conv_history_analyze_context()

        response_template = self.client.chat.completions.create(
            model=self.model,
            messages=self.conv_history,
            reasoning_effort="high",
            stream=False)
        
        message = response.choices[0].message
        if message.function_call.name == "generate_drawing_section":
            logger.info("Generating Drawing Section")
            code_blocks = self.drawing_agent.generate_drawing_section()
            logger.info("Generating Remaining Tech Pack")
            logger.info("Combining sections")
            new_template = self.combine_sections_agent.combine_sections(response_template.choices[0].message.content, code_blocks)
            self.conv_history.append({"role":"assistant", "content":f"Here is the new tempalte:\n{new_template}"})
        else:
            logger.info("Editing template")
            new_template = response_template.choices[0].message.content
            self.conv_history.append({"role":"assistant", "content":f"Here is the new template:\n{new_template}"})

        self.current_template = new_template

        return new_template
    
    def reset_conv_history_analyze_context(self):
            self.conv_history_analyze_context = [
            {'role':"developer", "content": "You will be given some information about a user request for a tech pack. Based on this information, decide if it is necessary to create the FRONT VIEW or BACK VIEW sections. If yes, Call the generate_drawing_section function."}
        ]

    
class ImageAnalysisAgent:
    def __init__(self, client, model="gpt-4o-2024-08-06"):
        self.__SYSTEM_PROMPT_CLASSIFICATION = SYSTEM_PROMPT_IMAGE_ANALYSIS_AGENT_CLASSIFICATION
        self.__SYSTEM_PROMPT_SELECTION = SYSTEM_PROMPT_IMAGE_ANALYSIS_AGENT_SELECTION
        self.model = model
        self.kpt_detector = ViTFashionDetector(num_labels=6).to(DEVICE)
        load_checkpoint("./detector/checkpoint_epoch_30.pth", self.kpt_detector)
        self.client = client
        self.conv_history_classification =[
            {"role": "developer", "content": self.__SYSTEM_PROMPT_CLASSIFICATION},     # Provide general instructions and tasks
            ]
        self.conv_history_selection =[
        {"role": "developer", "content": self.__SYSTEM_PROMPT_SELECTION},     # Provide general instructions and tasks
        ]
    
    def analyze_images(self, img_folder_path):
        img_names = os.listdir(img_folder_path)
        imgs = [os.path.join(img_folder_path, name) for name in img_names]

        conv = {
        "role": "user",''
        "content": [{
            "type": "text",
            "text": (
                "Here are the illustration image(s).\n"
                "<REMEMBER>\n"
                f"The names of these illustration images are {[name for name in img_names]}. These come in the same order as the images.\n"
                "</REMEMBER>"
                )
            }]
        }
            
        for img in imgs:
            with open(img, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
            
            conv["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
            })

        self.conv_history_classification.append(conv)

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=self.conv_history_classification,
            response_format=ImageNamesTemplate,
        )

        image_names = response.choices[0].message.parsed.image_names
        logger.info("Detecting Keypoints...")
        imgs_with_kpts, kpts = self.detect_keypoints(img_folder_path, image_names)
        logger.info("Filtering Relevant Keypoints...")
        self.filter_keypoints(imgs_with_kpts, img_folder_path, image_names, kpts)
        self.reset_conv_history()   # Delete conversation history to start with a blank slate after detection.
    
    def detect_keypoints(self, img_folder_path, img_names, save=False):
        img_paths = [os.path.join(img_folder_path, name) for name in img_names]  
        images = [Image.open(img_path) for img_path in img_paths]
        new_images = []
        detected_kpts = []
        for idx, image in enumerate(images):
            W, H = image.size
            resized_img = image.resize([192,256])
            normalized_image = normalize_image(resized_img)
            x = torch.tensor(normalized_image).permute(2,0,1).unsqueeze(0).float()
            with torch.no_grad():
                out = self.kpt_detector(x)
            kpts = extract_keypoints_from_heatmap(out['heatmaps'][0])
            kpts_list = []
            for kp in kpts:
                kpts_list.append([kp[0], kp[1]])

            kpts = torch.tensor(kpts_list)*4
            kpts = augment_upper_body_kpts(kpts)
            kpts[:,0] = kpts[:,0]*(W/192)
            kpts[:,1] = kpts[:,1]*(H/256)

            new_image = draw_keypoints(np.array(image), kpts)
            new_images.append(Image.fromarray(new_image))
            detected_kpts.append(kpts)

            if save:
                Image.fromarray(new_image).save(img_paths[idx])

        return new_images, detected_kpts

    def filter_keypoints(self, imgs_with_kpts, img_folder_path, image_names, kpts):
        img_paths = [os.path.join(img_folder_path, name) for name in image_names]
        for idx, img in enumerate(imgs_with_kpts):
            buffer = BytesIO()
            img.save(buffer, format=img.format or "PNG")
            encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

            conv = {
            "role": "user",''
            "content": [{
                "type": "text",
                "text": (
                    "Here is the image with green keypoints painted on it.\n"
                    )
                }]
            }
            conv["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
            })
            self.conv_history_selection.append(conv)

            response = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=self.conv_history_selection,
                response_format=FilteredKeypointsTemplate,
            )

            filtered_kpt_inds = response.choices[0].message.parsed.filtered_kpts
            filtered_kpt_inds = [ind-1 for ind in filtered_kpt_inds]
            logger.info(filtered_kpt_inds)
            try:
                filtered_kpts = kpts[idx][filtered_kpt_inds]
            except Exception as e:
                logger.info(e)
                continue
            
            original_img = Image.open(img_paths[idx])
            new_image = draw_keypoints(np.array(original_img), filtered_kpts)
            Image.fromarray(new_image).save(img_paths[idx])
            self.reset_selection_history()
            logger.info(f"Filtered and saved {image_names[idx]} with {len(filtered_kpts)} keypoints.")
            
    def reset_classification_history(self):
        self.conv_history_classification = [
            {"role": "developer", "content": self.__SYSTEM_PROMPT_CLASSIFICATION},     # Provide general instructions and tasks
            ]
        
    def reset_selection_history(self):
        self.conv_history_selection = [
        {"role": "developer", "content": self.__SYSTEM_PROMPT_SELECTION},     # Provide general instructions and tasks
        ]

    def reset_conv_history(self):
        self.reset_classification_history()
        self.reset_selection_history()


class DrawingSectionAgent:
    def __init__(self, client, model):
        self.client = client
        self.model = model
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_DRAWING_AGENT
        self.conv_history = [
            {"role": "developer", "content": self.__SYSTEM_PROMPT},     # Provide general instructions and tasks
            ]
        
    def generate_drawing_section(self):
        self.conv_history.append({"role":"user", "content": f"{GENERATE_DRAWING_PROMPT}"})

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=self.conv_history,
            response_format=DrawingCodeTemplate,
        )
        # front_code, back_code = response.choices[0].message.parsed.front_code, response.choices[0].message.parsed.back_code
        code_blocks = response.choices[0].message.parsed.code_blocks
        logger.info(f'NUM BLOCKS: {len(code_blocks)}')
        for idx, block in enumerate(code_blocks):
            self.conv_history.append({"role":"assistant", "content": f"Here is code block {idx+1}: {block}"})

        return code_blocks

class CombinedSectionsAgent:
    def __init__(self, client, model):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_COMBINE_SECTIONS_AGENT
        self.client = client
        self.model = model
        self.conv_history = [
            {"role": "developer", "content": self.__SYSTEM_PROMPT},  
            ]
    
    # def combine_sections(self, current_template, front_code, back_code):
    #     print(current_template)
    #     self.conv_history.append({"role":"user", "content": f"Here is the current template: \n\ {current_template}"})
    #     self.conv_history.append({"role":"user", "content": f"Here is the front section template, copy this over to the current template: \n\ {front_code}"})
    #     self.conv_history.append({"role":"user", "content": f"Here is the back section template, copy this over to the current template: \n\ {back_code}"})

    #     response = self.client.beta.chat.completions.parse(
    #         model=self.model,
    #         messages=self.conv_history,
    #         response_format=FullTemplate,
    #     )

    #     self.conv_history = [
    #         {"role": "developer", "content": self.__SYSTEM_PROMPT},  
    #         ]

    #     return response.choices[0].message.parsed.template_code

    # def combine_sections(self, current_template, code_blocks):
    #     self.conv_history.append({"role":"user", "content": f"Here is the current template: \n\ {current_template}"})
    #     self.conv_history.append({"role":"user", "content": f"Here are the code templates you should merge with the current template. I will give you them one by one. Merge them in the same order as you receive them.\n\
    #                               <IMPORTANT>Make sure to merge ALL the code blocks. Double check to that you do not accidentally leave one out.</IMPORTANT>"})
    #     for idx, block in enumerate(code_blocks):
    #         self.conv_history.append({"role":"user", "content": f" Here is code block {idx}: {block}"})

    #     response = self.client.beta.chat.completions.parse(
    #         model=self.model,
    #         messages=self.conv_history,
    #         response_format=FullTemplate,
    #     )

    #     self.conv_history = [
    #         {"role": "developer", "content": self.__SYSTEM_PROMPT},  
    #         ]

    #     return response.choices[0].message.parsed.template_code

    def combine_sections(self, current_template, code_blocks):
        drawing_code = ""
        for block in code_blocks:
            drawing_code += f"{block}\n"
        
        template = replace_between_markers(current_template,
                                           "%%START_DRAWING_SECTION%%",
                                           "%%END_DRAWING_SECTION%%",
                                           drawing_code)

        return template