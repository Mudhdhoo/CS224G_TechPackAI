import argparse
from agent import TechPack_Assistant
from models import OpenAI_GPT

def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--designer_name", type=str, help="The name of the designer") 
    parser.add_argument("--brand_name", type=str, help="The name of your brand") 
    parser.add_argument("--model", type=str, help="Specify LLM model")
    parser.add_argument("--model_name", type=str, help="Specify the version of the LLM model (e.g gpt-4o)")
    parser.add_argument("--reference_dir", type=str, help="Directory of the reference images")
    parser.add_argument("--illustration_dir", type=str, help="Directory to the illustration images.")

    args = parser.parse_args()

    return args

def main():
    args = get_args()

    if args.model == 'OpenAI':
        model = OpenAI_GPT

    agent = TechPack_Assistant(model=model, 
                               brand_name=args.brand_name,
                               designer_name=args.designer_name, 
                               model_name=args.model_name,
                               reference_dir=args.reference_dir,
                               illustration_dir=args.illustration_dir)
    agent.chat()

if __name__ == "__main__":
    main()