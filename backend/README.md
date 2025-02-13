# Tech Pack Assistant for Fashion Designers

In the fashion industry, a Tech Pack serves as a crucial blueprint that communicates design specifications to manufacturers, detailing everything from materials and measurements to construction techniques. Creating a Tech Pack is a meticulous and time-consuming process that requires precision to avoid costly production errors and miscommunications. However, traditional methods often involve repetitive manual tasks, making the process inefficient and prone to human error. 

This is the problem we are attempting to solve in this project - To automate the manual process of tech pack curation, with the aim of drastically reducing the time and mental burden required for this task. We aim to tackle this problem by building an AI assistant which works alongside the designer to execute the tedious parts of the task. The process usually begins with a set of illustration of the design to be manufactured, accompanied with a set of reference images which serves as inspiration for the final product. Given these inputs, our AI will output information such as the materials needed for manufacturing and highlight areas of potential ambiguity in the design. The aim of the final product is to extrapolate these current capabilities to include automatic completion of a tech pack template, and additional information extraction through an interactive conversation interface between the designer and the AI.

## Team Contributions - Sprint 1

John (Mudhdhoo) - Wrote the code for the backend OpenAI API (the code in this repository).

William (WilliamEkberg) - Wrote the code for the frontend (not yet connected to the API). Market research on the subject of Tech Pack creation.

Nico (nicohenning) - Market research on the subject of Tech Pack creation. Created and planned the Spring 1 presentation.

## Installation Guide
### Clone the repository
```
git clone https://github.com/Mudhdhoo/CS224G_TechPackAI.git
```
### Create the environment
```
conda env create -f environment.yml
```

### Activate the environment
```
conda activate cs224G_techpack_ai
```

### Run the code
```
# Nagivate to the source directory
cd src
# Initialize the conversation
python main.py --brand_name "Björn Borg" \
               --model OpenAI \
               --model_name gpt-4o \
               --reference_dir ../reference \
               --illustration_dir ../illustration
```
