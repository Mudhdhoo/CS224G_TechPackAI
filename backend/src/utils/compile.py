import os
import subprocess
import logging
import shutil

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_latex_txt_file(directory):
    """Finds the first `.txt` file in the directory that contains LaTeX code."""
    for file in os.listdir(directory):
        if file.endswith(".txt"):
            return os.path.join(directory, file)
    return None

def compile_latex_from_txt(project_dir):
    """
    Converts a .txt LaTeX file to .tex and compiles it into a PDF using MacTeX.
    
    Parameters:
        project_dir (str): The directory containing the LaTeX .txt file and other assets.
    
    Returns:
        str: Path to the generated PDF file, or None if compilation fails.
    """
    try:
        if not os.path.exists(project_dir):
            logger.error(f"❌ Error: Project directory '{project_dir}' does not exist.")
            return None

        # Find the LaTeX .txt file
        txt_file_path = find_latex_txt_file(project_dir)
        if not txt_file_path:
            logger.error("❌ No LaTeX `.txt` file found in the directory.")
            return None

        # Validate that the .txt file has content
        with open(txt_file_path, 'r') as txt_file:
            latex_content = txt_file.read()
            if not latex_content.strip():
                logger.error("❌ LaTeX file is empty.")
                return None

        # Generate the base name for files
        base_name = os.path.splitext(os.path.basename(txt_file_path))[0]
        tex_file_path = os.path.join(project_dir, base_name + ".tex")
        output_pdf_path = os.path.join(project_dir, base_name + ".pdf")

        # The standard name we want to use for all tech pack PDFs
        final_pdf_path = os.path.join(project_dir, "tech_pack.pdf")

        # Write the content to a .tex file
        logger.info(f"Writing LaTeX content to {tex_file_path}")
        with open(tex_file_path, 'w') as tex_file:
            tex_file.write(latex_content)

        # Verify .tex file was written correctly
        if not os.path.exists(tex_file_path) or os.path.getsize(tex_file_path) == 0:
            logger.error("❌ Failed to write content to .tex file")
            return None

        try:
            # Run pdflatex twice to resolve references
            for i in range(2):
                logger.info(f"Running pdflatex compilation pass {i+1}")
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", project_dir, tex_file_path],
                    cwd=project_dir,
                    check=False,
                    capture_output=True,
                    text=True
                )
                
                # Log the output for debugging
                with open(os.path.join(project_dir, "compile.log"), "a") as log_file:
                    log_file.write(f"=== Compilation Pass {i+1} ===\n")
                    log_file.write(result.stdout)
                    log_file.write(result.stderr)
                
                # Check for biber references on first pass
                bib_files = [f for f in os.listdir(project_dir) if f.endswith(".bib")]
                if i == 0 and bib_files:
                    subprocess.run(["biber", base_name], cwd=project_dir, check=False)

            # Check if PDF was created, regardless of compilation errors
            if os.path.exists(output_pdf_path):
                logger.info(f"✅ PDF generated (with warnings): {output_pdf_path}")
                # Rename the PDF to tech_pack.pdf for consistency
                if os.path.exists(final_pdf_path):
                    os.remove(final_pdf_path)
                os.rename(output_pdf_path, final_pdf_path)
                return final_pdf_path
            else:
                logger.error(f"❌ Expected PDF not found: {output_pdf_path}")
                return None

        except Exception as e:
            logger.error(f"❌ Exception during compilation: {str(e)}")
            return None

    except Exception as e:
        logger.error(f"❌ Unexpected error during compilation: {str(e)}")
        return None
        
    return None


#current_dir = os.path.dirname(os.path.abspath(__file__))
#project_folder = os.path.join(current_dir, "project")

# Compile LaTeX document
#pdf_path = compile_latex_from_txt(project_folder)
