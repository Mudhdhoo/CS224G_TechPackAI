import os
import subprocess

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

    if not os.path.exists(project_dir):
        print(f"❌ Error: Project directory '{project_dir}' does not exist.")
        return None

    
    txt_file_path = find_latex_txt_file(project_dir)
    if not txt_file_path:
        print("❌ No LaTeX `.txt` file found in the directory.")
        return None

   
    base_name = os.path.splitext(os.path.basename(txt_file_path))[0]
    tex_file_path = os.path.join(project_dir, base_name + ".tex")


    with open(txt_file_path, 'r') as txt_file:
        latex_content = txt_file.read()

    with open(tex_file_path, 'w') as tex_file:
        tex_file.write(latex_content)

    
    output_pdf_path = os.path.join(project_dir, base_name + ".pdf")

    try:
        
        for i in range(2):
            subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", project_dir, tex_file_path],
                cwd=project_dir,  
                check=True
            )

            
            bib_files = [f for f in os.listdir(project_dir) if f.endswith(".bib")]
            if i == 0 and bib_files:
                subprocess.run(["biber", base_name], cwd=project_dir, check=True)

        print(f"✅ PDF successfully compiled: {output_pdf_path}")

    except subprocess.CalledProcessError:
        print("❌ LaTeX compilation failed. Check your .tex file for errors.")
        return None

    return output_pdf_path


current_dir = os.path.dirname(os.path.abspath(__file__))
project_folder = os.path.join(current_dir, "project")

# Compile LaTeX document
pdf_path = compile_latex_from_txt(project_folder)
