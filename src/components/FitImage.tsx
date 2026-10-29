import React from 'react';

/**
 * An engine's own link is never shown: over its free limit it serves a "Free
 * limit reached" card instead of the picture. Only copies kept in our bucket or
 * in the repository are images we can trust.
 */
export function usableImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return /pollinations\.ai|fal\.media|fal\.run/.test(url) ? null : url;
}

interface FitImageProps {
  src: string;
  alt?: string;
  /** Classes for the box. In "box" mode the box sets the size; in "natural" mode the image does. */
  className?: string;
  mode?: 'box' | 'natural';
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Shows an image whole, never cropped. In a box of fixed proportions the full
 * picture sits over a blurred, darkened copy of itself, so a square image in a
 * wide frame keeps its composition. In natural mode the frame takes the
 * image's own proportions.
 */
const FitImage: React.FC<FitImageProps> = ({
  src,
  alt = '',
  className = '',
  mode = 'box',
  imgClassName = '',
  loading = 'lazy',
}) => {
  if (mode === 'natural') {
    return (
      <div className={className}>
        <img src={src} alt={alt} loading={loading} className={`block h-auto w-full ${imgClassName}`} />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading={loading}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl brightness-75"
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`relative h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  );
};

export default FitImage;
