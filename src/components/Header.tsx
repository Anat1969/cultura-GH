import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isActive = (path: string) =>
    path === '/concepts' ? location.pathname.startsWith('/concept') : location.pathname === path;

  const links = [
    { to: '/', label: 'בית' },
    { to: '/library', label: 'ספרייה' },
    { to: '/concepts', label: 'קונספטים' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/40 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3">
          <motion.span className="text-2xl font-heading font-bold text-primary" whileHover={{ scale: 1.05 }}>
            CultureArch
          </motion.span>
          <span className="text-sm text-muted-foreground hidden sm:inline">מרחבי תרבות</span>
        </Link>

        <nav className="flex items-center gap-2">
          {links.map(l => (
            <Button key={l.to} variant={isActive(l.to) ? 'default' : 'ghost'} size="sm" asChild>
              <Link to={l.to}>{l.label}</Link>
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="mr-2">
            {theme === 'dark' ? 'בהיר' : 'כהה'}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
