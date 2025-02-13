
const Footer = () => {
  return (
    <footer className="border-t border-neutral-200 bg-background">
      <div className="container-padding py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-blue rounded-full"></div>
            <span className="text-xl font-semibold text-foreground">TackPack.AI</span>
          </div>
          
          <div className="flex gap-8 text-sm text-neutral-600">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <p className="text-sm text-neutral-600">
            © 2024 TackPack.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
