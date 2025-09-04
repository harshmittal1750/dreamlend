import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  showLoader?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.jpg",
  showLoader = true,
  className = "",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showLoader && isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}

      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        priority={props.priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        {...props}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}

// SEO-optimized image component with structured data
interface SEOImageProps extends OptimizedImageProps {
  caption?: string;
  photographer?: string;
  license?: string;
}

export function SEOImage({
  caption,
  photographer,
  license,
  ...props
}: SEOImageProps) {
  const imageStructuredData = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: props.src,
    description: props.alt,
    ...(caption && { caption }),
    ...(photographer && {
      creator: {
        "@type": "Person",
        name: photographer,
      },
    }),
    ...(license && { license }),
  };

  return (
    <figure className="space-y-2">
      <OptimizedImage {...props} />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(imageStructuredData),
        }}
      />
    </figure>
  );
}
