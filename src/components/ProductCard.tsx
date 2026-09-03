import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { useCart } from "../lib/CartContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type { Product, ProductVariant, ProductImage } from "../lib/types";
import OrderModal from "./OrderModal";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { whatsappNumber } = useAppContext();

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [variantsLoading, setVariantsLoading] = useState(true);

  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ProductVariant[]>(
          `/products/${product.id}/variants`
      ),
      api.get<ProductImage[]>(
          `/products/${product.id}/images`
      ),
    ])
        .then(([variantsData, imagesData]) => {
          // Sort variants by display order
          setVariants(
              [...variantsData].sort(
                  (a, b) => a.displayOrder - b.displayOrder
              )
          );

          // Put primary image first
          const sortedImages = [...imagesData]
              .sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return 0;
              })
              .map((img) => img.imageUrl);

          setImages(sortedImages);
          setCurrentImageIndex(0);
        })
        .catch(() => {})
        .finally(() => setVariantsLoading(false));
  }, [product.id]);

  // Automatic image slider
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const selectedVariant =
      variants.length > 0
          ? variants[selectedVariantIndex]
          : null;

  const displayPrice = selectedVariant
      ? selectedVariant.price
      : product.price;

  const isAvailable = selectedVariant
      ? selectedVariant.isAvailable && product.isAvailable
      : product.isAvailable;

  const { addItem } = useCart();

  const variantLabel = selectedVariant
      ? [
        selectedVariant.name,
        selectedVariant.weightOrSize,
      ]
          .filter(Boolean)
          .join(" — ")
      : product.weightOrSize ?? undefined;

  const handleEnquire = () => {
    if (!whatsappNumber) return;

    const msg =
        `Hello Mr.Pork Store! 👋\n\n` +
        `I'd like to enquire about *${product.name}*.\n\n` +
        `Could you please share more details? Thank you!`;

    window.open(
        `https://wa.me/${normalizeWhatsAppNumber(
            whatsappNumber
        )}?text=${encodeURIComponent(msg)}`,
        "_blank"
    );
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productVariantId: selectedVariant?.id ?? null,
      variantLabel: variantLabel ?? null,
      unitPrice: displayPrice,
    });
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
      <>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col border border-orange-100">

          {/* PRODUCT IMAGE CAROUSEL */}
          <div className="relative bg-orange-50 h-48 overflow-hidden group">

            {images.length > 0 ? (
                <>
                  {/* Sliding image track */}
                  <div
                      className="flex h-full transition-transform duration-700 ease-in-out"
                      style={{
                        transform: `translateX(-${
                            currentImageIndex * 100
                        }%)`,
                      }}
                  >
                    {images.map((image, index) => (
                        <div
                            key={`${image}-${index}`}
                            className="min-w-full h-full flex-shrink-0"
                        >
                          <img
                              src={image}
                              alt={`${product.name} - image ${
                                  index + 1
                              }`}
                              className="w-full h-full object-cover"
                          />
                        </div>
                    ))}
                  </div>

                  {/* Previous button */}
                  {images.length > 1 && (
                      <button
                          type="button"
                          onClick={handlePreviousImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                  )}

                  {/* Next button */}
                  {images.length > 1 && (
                      <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                  )}

                  {/* Slider dots */}
                  {images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() =>
                                    setCurrentImageIndex(index)
                                }
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    index === currentImageIndex
                                        ? "w-5 bg-white"
                                        : "w-2 bg-white/60"
                                }`}
                                aria-label={`Go to image ${
                                    index + 1
                                }`}
                            />
                        ))}
                      </div>
                  )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {product.category.toLowerCase() ===
                  "chicken"
                      ? "🐔"
                      : "🐷"}
                </div>
            )}

            {/* Unavailable overlay */}
            {!isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Unavailable
              </span>
                </div>
            )}

            {/* Available badge */}
            {isAvailable && (
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Available
            </span>
            )}

            {/* Product type badge */}
            <span className="absolute top-3 left-3 bg-[#1C0A00]/70 text-white text-xs px-2.5 py-1 rounded-full capitalize">
            {product.productType}
          </span>
          </div>

          {/* PRODUCT DETAILS */}
          <div className="p-5 flex flex-col flex-1">

            <h3 className="font-display font-700 text-lg text-[#1C0A00] mb-1">
              {product.name}
            </h3>

            {product.description && (
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  {product.description}
                </p>
            )}

            {/* VARIANTS */}
            {variantsLoading ? (
                <div className="mb-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />

                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse"
                        />
                    ))}
                  </div>
                </div>
            ) : variants.length > 0 ? (
                <div className="mb-4">

                  <p className="text-xs font-semibold text-[#78350F] uppercase tracking-wider mb-2">
                    Select Size / Weight
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {variants.map((v, i) => (
                        <button
                            key={v.id}
                            onClick={() =>
                                setSelectedVariantIndex(i)
                            }
                            disabled={!v.isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                !v.isAvailable
                                    ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                    : selectedVariantIndex === i
                                        ? "bg-[#9B1C1C] text-white border-[#9B1C1C]"
                                        : "bg-white text-[#1C0A00] border-gray-200 hover:border-[#9B1C1C]"
                            }`}
                        >
                          {[v.name, v.weightOrSize]
                              .filter(Boolean)
                              .join(" · ")}
                        </button>
                    ))}
                  </div>
                </div>
            ) : product.weightOrSize ? (
                <div className="mb-4">
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                {product.weightOrSize}
              </span>
                </div>
            ) : null}

            {/* PRICE */}
            {displayPrice !== null && (
                <p className="text-[#9B1C1C] font-display font-700 text-xl mb-4">
                  ₦{displayPrice.toLocaleString()}
                </p>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-auto space-y-2">

              <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable || variantsLoading}
                  className="w-full bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>

                Add to Cart
              </button>

              <div className="flex gap-2">

                <button
                    onClick={() =>
                        setShowOrderModal(true)
                    }
                    disabled={!isAvailable}
                    className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors"
                >
                  Order Now
                </button>

                <button
                    onClick={handleEnquire}
                    className="px-3 py-2.5 border border-gray-200 hover:border-[#9B1C1C] text-gray-500 hover:text-[#9B1C1C] rounded-xl text-sm transition-colors"
                >
                  Enquire
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* ORDER MODAL */}
        {showOrderModal && (
            <OrderModal
                productId={product.id}
                productName={product.name}
                variant={selectedVariant}
                basePrice={product.price}
                onClose={() => setShowOrderModal(false)}
            />
        )}
      </>
  );
}