import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { useCart } from "../lib/CartContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type {
  Product,
  ProductVariant,
  ProductImage,
} from "../lib/types";
import OrderModal from "./OrderModal";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { whatsappNumber } = useAppContext();
  const { addItem } = useCart();

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [variantsLoading, setVariantsLoading] = useState(true);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showOrderModal, setShowOrderModal] = useState(false);

  // ============================================================
  // LOAD VARIANTS + IMAGES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProductData() {
      setVariantsLoading(true);

      try {
        const [variantsData, imagesData] = await Promise.all([
          api.get<ProductVariant[]>(
              `/products/${product.id}/variants`
          ),
          api.get<ProductImage[]>(
              `/products/${product.id}/images`
          ),
        ]);

        if (cancelled) return;

        // Sort variants
        const sortedVariants = [...variantsData].sort(
            (a, b) => a.displayOrder - b.displayOrder
        );

        // Sort images by display order.
        // Primary image is first when orders are equal.
        const sortedImages = [...imagesData].sort((a, b) => {
          const orderA = a.displayOrder ?? 0;
          const orderB = b.displayOrder ?? 0;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          if (a.isPrimary && !b.isPrimary) {
            return -1;
          }

          if (!a.isPrimary && b.isPrimary) {
            return 1;
          }

          return 0;
        });

        setVariants(sortedVariants);
        setImages(sortedImages);
        setCurrentImageIndex(0);

        // Preload images
        sortedImages.forEach((image) => {
          const img = new Image();
          img.src = image.imageUrl;
        });
      } catch (error) {
        console.error(
            "Could not load product variants/images:",
            error
        );
      } finally {
        if (!cancelled) {
          setVariantsLoading(false);
        }
      }
    }

    loadProductData();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  // ============================================================
  // AUTOMATIC SLIDER
  // ============================================================

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentImageIndex((current) => {
        return current >= images.length - 1
            ? 0
            : current + 1;
      });
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [images, currentImageIndex]);

  // ============================================================
  // PREVIOUS
  // ============================================================

  const previousImage = () => {
    if (images.length <= 1) return;

    setCurrentImageIndex((current) => {
      return current === 0
          ? images.length - 1
          : current - 1;
    });
  };

  // ============================================================
  // NEXT
  // ============================================================

  const nextImage = () => {
    if (images.length <= 1) return;

    setCurrentImageIndex((current) => {
      return current >= images.length - 1
          ? 0
          : current + 1;
    });
  };

  // ============================================================
  // SELECTED VARIANT
  // ============================================================

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

  const variantLabel = selectedVariant
      ? [
        selectedVariant.name,
        selectedVariant.weightOrSize,
      ]
          .filter(Boolean)
          .join(" — ")
      : product.weightOrSize ?? undefined;

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productVariantId: selectedVariant?.id ?? null,
      variantLabel: variantLabel ?? null,
      unitPrice: displayPrice,
    });
  };

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleEnquire = () => {
    if (!whatsappNumber) return;

    const message =
        `Hello Mr.Pork Store! 👋\n\n` +
        `I'd like to enquire about *${product.name}*.\n\n` +
        `Could you please share more details? Thank you!`;

    const number =
        normalizeWhatsAppNumber(whatsappNumber);

    window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(
            message
        )}`,
        "_blank"
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
      <>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col border border-orange-100">

          {/* ======================================================
            IMAGE CAROUSEL
        ====================================================== */}

          <div className="relative h-48 bg-orange-50 overflow-hidden group">

            {images.length > 0 ? (
                <div className="absolute inset-0">

                  {/* SLIDING TRACK */}

                  <div
                      className="absolute inset-0 flex"
                      style={{
                        width: `${images.length * 100}%`,
                        transform: `translateX(-${
                            (currentImageIndex * 100) /
                            images.length
                        }%)`,
                        transition:
                            "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                  >
                    {images.map((image, index) => (
                        <div
                            key={`${image.id}-${index}`}
                            className="relative h-full flex-shrink-0"
                            style={{
                              width: `${100 / images.length}%`,
                            }}
                        >
                          <img
                              src={image.imageUrl}
                              alt={`${product.name} - image ${
                                  index + 1
                              }`}
                              className="absolute inset-0 w-full h-full object-cover"
                              draggable={false}
                          />
                        </div>
                    ))}
                  </div>

                  {/* ==================================================
                  LEFT BUTTON
              ================================================== */}

                  {images.length > 1 && (
                      <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            previousImage();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                  )}

                  {/* ==================================================
                  RIGHT BUTTON
              ================================================== */}

                  {images.length > 1 && (
                      <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                  )}

                  {/* ==================================================
                  DOTS
              ================================================== */}

                  {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setCurrentImageIndex(index);
                                }}
                                aria-label={`Go to image ${
                                    index + 1
                                }`}
                                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                                    index === currentImageIndex
                                        ? "w-6 bg-white"
                                        : "w-2 bg-white/60 hover:bg-white"
                                }`}
                            />
                        ))}
                      </div>
                  )}
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {product.category.toLowerCase() ===
                  "chicken"
                      ? "🐔"
                      : "🐷"}
                </div>
            )}

            {/* ======================================================
              UNAVAILABLE
          ====================================================== */}

            {!isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 pointer-events-none">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Unavailable
              </span>
                </div>
            )}

            {/* ======================================================
              AVAILABLE
          ====================================================== */}

            {isAvailable && (
                <span className="absolute top-3 right-3 z-40 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
              Available
            </span>
            )}

            {/* ======================================================
              PRODUCT TYPE
          ====================================================== */}

            <span className="absolute top-3 left-3 z-40 bg-[#1C0A00]/70 text-white text-xs px-2.5 py-1 rounded-full capitalize pointer-events-none">
            {product.productType}
          </span>

          </div>

          {/* ======================================================
            PRODUCT INFORMATION
        ====================================================== */}

          <div className="p-5 flex flex-col flex-1">

            <h3 className="font-display font-700 text-lg text-[#1C0A00] mb-1">
              {product.name}
            </h3>

            {product.description && (
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  {product.description}
                </p>
            )}

            {/* ====================================================
              VARIANTS
          ==================================================== */}

            {variantsLoading ? (
                <div className="mb-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />

                  <div className="flex gap-2">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
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
                    {variants.map((variant, index) => (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() =>
                                setSelectedVariantIndex(index)
                            }
                            disabled={!variant.isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                !variant.isAvailable
                                    ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                    : selectedVariantIndex === index
                                        ? "bg-[#9B1C1C] text-white border-[#9B1C1C]"
                                        : "bg-white text-[#1C0A00] border-gray-200 hover:border-[#9B1C1C]"
                            }`}
                        >
                          {[
                            variant.name,
                            variant.weightOrSize,
                          ]
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

            {/* ====================================================
              PRICE
          ==================================================== */}

            {displayPrice !== null && (
                <p className="text-[#9B1C1C] font-display font-700 text-xl mb-4">
                  ₦{displayPrice.toLocaleString()}
                </p>
            )}

            {/* ====================================================
              ACTION BUTTONS
          ==================================================== */}

            <div className="mt-auto space-y-2">

              <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                      !isAvailable || variantsLoading
                  }
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
                    type="button"
                    onClick={() =>
                        setShowOrderModal(true)
                    }
                    disabled={!isAvailable}
                    className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors"
                >
                  Order Now
                </button>

                <button
                    type="button"
                    onClick={handleEnquire}
                    className="px-3 py-2.5 border border-gray-200 hover:border-[#9B1C1C] text-gray-500 hover:text-[#9B1C1C] rounded-xl text-sm transition-colors"
                >
                  Enquire
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
          ORDER MODAL
      ======================================================== */}

        {showOrderModal && (
            <OrderModal
                productId={product.id}
                productName={product.name}
                variant={selectedVariant}
                basePrice={product.price}
                onClose={() =>
                    setShowOrderModal(false)
                }
            />
        )}
      </>
  );
}