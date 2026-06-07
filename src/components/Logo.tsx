export default function Logo({ className = '', iconOnly = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img 
        src="/logo.png" 
        alt="LEADSGLOBAL Logo"
        className="w-16 h-16 object-contain shrink-0 transform hover:scale-105 transition-all duration-300"
      />
    </div>
  );
}