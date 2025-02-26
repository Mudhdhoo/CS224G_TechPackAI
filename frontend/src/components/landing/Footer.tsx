
const Footer = () => {
  return (
    <footer className="border-t border-neutral-200 bg-background">
      <div className="container-padding py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-blue rounded-full"></div>
            <span className="text-xl font-semibold text-foreground">TackPack.AI</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-8 text-sm text-neutral-600">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>

            <div className="h-4 w-px bg-neutral-200 mx-2" />

            <div className="flex items-center gap-2 text-neutral-600 text-sm">
              <span>Built with</span>
              <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>by Stanford students</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
