import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => (
  <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="px-1 text-muted-foreground/60">/</span>}
        {item.to ? (
          <Link to={item.to} className="hover:text-primary transition-colors">
            {item.label}
          </Link>
        ) : (
          <span className="text-foreground font-medium">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumbs;
