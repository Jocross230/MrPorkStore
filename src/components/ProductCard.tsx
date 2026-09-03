import { useEffect, useRef, useState } from "react";
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

  // ============================================================
  // PRODUCT VARIANTS
  // ============================================================

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [variantsLoading, setVariantsLoading] = useState(true);

  // ============================================================
  // PRODUCT IMAGES
  // ============================================================

  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /*
   * IMPORTANT:
   *
   * The track contains:
   *
   * [LAST IMAGE] [IMAGE 1] [IMAGE 2] [IMAGE 3] [FIRST IMAGE]
   *
   * This allows us to create a proper infinite sliding carousel.
   */
  const [trackIndex, setTrackIndex] = useState(1);

  /*
   * Controls whether the CSS transition is active.
   *
   * We temporarily disable it when jumping from a cloned image
   * back to the real image.
   */
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  // ============================================================
  // OTHER STATE
  // ============================================================

  const [showOrderModal, setShowOrderModal] = useState(false);

  /*
   * Used for swipe detection.
   *
   * Ref is used instead of state because changing the starting
   * pointer position should NOT cause a React re-render.
   */
  const touchStartX = useRef<number | null>(null);

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

        if (cancelled) {
          return;
        }

        // --------------------------------------------------------
        // SORT VARIANTS
        // --------------------------------------------------------

        const sortedVariants = [...variantsData].sort(
            (a, b) => a.displayOrder - b.displayOrder
        );

        // --------------------------------------------------------
        // SORT IMAGES
        // --------------------------------------------------------

        const sortedImages = [...imagesData]
            .filter((image) => Boolean(image.imageUrl))
            .sort((a, b) => {
              /*
               * displayOrder is the primary ordering.
               */
              if (a.displayOrder !== b.displayOrder) {
                return a.displayOrder - b.displayOrder;
              }

              /*
               * If two images have the same order,
               * primary image wins.
               */
              if (a.isPrimary && !b.isPrimary) {
                return -1;
              }

              if (!a.isPrimary && b.isPrimary) {
                return 1;
              }

              return 0;
            });

        console.log(
            `[ProductCard] ${product.name}: ${sortedImages.length} image(s) loaded`
        );

        console.log(
            sortedImages.map((image) => ({
              id: image.id,
              displayOrder: image.displayOrder,
              isPrimary: image.isPrimary,
              url: image.imageUrl,
            }))
        );

        setVariants(sortedVariants);

        setImages(sortedImages);

        /*
         * Always begin from the first real image.
         */
        setCurrentImageIndex(0);

        /*
         * For multiple images:
         *
         * track position 0 = cloned last image
         * track position 1 = first real image
         */
        setTrackIndex(sortedImages.length > 1 ? 1 : 0);

        setTransitionEnabled(true);
      } catch (error) {
        console.error(
            `[ProductCard] Failed to load data for ${product.name}:`,
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
  }, [product.id, product.name]);

  // ============================================================
  // NEXT IMAGE
  // ============================================================

  const goNext = () => {
    if (images.length <= 1) {
      return;
    }

    /*
     * Make sure the movement is animated.
     */
    setTransitionEnabled(true);

    /*
     * Update the visible/dot indicator.
     */
    setCurrentImageIndex((current) => {
      if (current >= images.length - 1) {
        return 0;
      }

      return current + 1;
    });

    /*
     * Move the actual track one slide.
     */
    setTrackIndex((current) => current + 1);
  };

  // ============================================================
  // PREVIOUS IMAGE
  // ============================================================

  const goPrevious = () => {
    if (images.length <= 1) {
      return;
    }

    setTransitionEnabled(true);

    setCurrentImageIndex((current) => {
      if (current <= 0) {
        return images.length - 1;
      }

      return current - 1;
    });

    setTrackIndex((current) => current - 1);
  };

  // ============================================================
  // GO DIRECTLY TO IMAGE
  // ============================================================

  const goToImage = (index: number) => {
    if (images.length <= 1) {
      return;
    }

    if (index < 0 || index >= images.length) {
      return;
    }

    setTransitionEnabled(true);

    setCurrentImageIndex(index);

    /*
     * +1 because track position 0 is the cloned last image.
     */
    setTrackIndex(index + 1);
  };

  // ============================================================
  // AUTOMATIC SLIDER
  // ============================================================

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    /*
     * Automatically move every 3 seconds.
     */
    const interval = window.setInterval(() => {
      goNext();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [images.length]);

  // ============================================================
  // INFINITE CAROUSEL RESET
  // ============================================================

  const handleTrackTransitionEnd = () => {
    if (images.length <= 1) {
      return;
    }

    /*
     * Example with 3 images:
     *
     * [3] [1] [2] [3] [1]
     *                 ^
     *              index 4
     *
     * We just animated from real image 3 to cloned image 1.
     *
     * Now silently jump back to real image 1.
     */
    if (trackIndex === images.length + 1) {
      setTransitionEnabled(false);
      setTrackIndex(1);

      /*
       * Wait two animation frames before enabling the
       * transition again. This prevents the reset itself
       * from being visible to the user.
       */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });

      return;
    }

    /*
     * Going backwards:
     *
     * [3] [1] [2] [3] [1]
     *  ^
     * index 0
     *
     * Silently jump to real image 3.
     */
    if (trackIndex === 0) {
      setTransitionEnabled(false);
      setTrackIndex(images.length);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
    }
  };

  // ============================================================
  // SWIPE / TOUCH
  // ============================================================

  const handlePointerDown = (
      event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (images.length <= 1) {
      return;
    }

    touchStartX.current = event.clientX;
  };

  const handlePointerUp = (
      event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
        images.length <= 1 ||
        touchStartX.current === null
    ) {
      return;
    }

    const distance =
        touchStartX.current - event.clientX;

    touchStartX.current = null;

    /*
     * Ignore tiny movements.
     */
    if (Math.abs(distance) < 50) {
      return;
    }

    /*
     * Swipe left = next.
     */
    if (distance > 0) {
      goNext();
    }

    /*
     * Swipe right = previous.
     */
    else {
      goPrevious();
    }
  };

  const handlePointerCancel = () => {
    touchStartX.current = null;
  };

  // ============================================================
  // SELECTED VARIANT
  // ============================================================

  const selectedVariant =
      variants.length > 0
          ? variants[selectedVariantIndex]
          : null;

  // ============================================================
  // PRICE
  // ============================================================

  const displayPrice = selectedVariant
      ? selectedVariant.price
      : product.price;

  // ============================================================
  // AVAILABILITY
  // ============================================================

  const isAvailable = selectedVariant
      ? selectedVariant.isAvailable &&
      product.isAvailable
      : product.isAvailable;

  // ============================================================
  // VARIANT LABEL
  // ============================================================

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
      productVariantId:
          selectedVariant?.id ?? null,
      variantLabel: variantLabel ?? null,
      unitPrice: displayPrice,
    });
  };

  // ============================================================
  // WHATSAPP ENQUIRY
  // ============================================================

  const handleEnquire = () => {
    if (!whatsappNumber) {
      return;
    }

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
  // BUILD CAROUSEL ARRAY
  //
  // For 3 images:
  //
  // [IMAGE 3] [IMAGE 1] [IMAGE 2] [IMAGE 3] [IMAGE 1]
  //     0          1          2          3          4
  //
  // We start at position 1.
  // ============================================================

  const carouselImages =
      images.length > 1
          ? [
            images[images.length - 1],
            ...images,
            images[0],
          ]
          : images;

  // ============================================================
  // RENDER
  // ============================================================

  return (
      <>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col border border-orange-100">

          {/* ======================================================
          IMAGE CAROUSEL
        ====================================================== */}

          <div
              className="relative h-48 bg-orange-50 overflow-hidden group select-none"
              style={{
                touchAction: "pan-y",
              }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
          >

            {images.length > 0 ? (
                <>
                  {/* ==================================================
                ACTUAL SLIDING TRACK
              ================================================== */}

                  <div
                      className="absolute inset-0 flex"
                      style={{
                        transform: `translate3d(-${
                            trackIndex * 100
                        }%, 0, 0)`,

                        transition: transitionEnabled
                            ? "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)"
                            : "none",

                        willChange: "transform",
                      }}
                      onTransitionEnd={
                        handleTrackTransitionEnd
                      }
                  >

                    {carouselImages.map(
                        (image, index) => (
                            <div
                                key={`${image.id}-${index}`}
                                className="relative h-full w-full flex-shrink-0"
                            >
                              <img
                                  src={image.imageUrl}
                                  alt={`${product.name} - image ${
                                      index + 1
                                  }`}
                                  className="block w-full h-full object-cover pointer-events-none"
                                  draggable={false}
                              />
                            </div>
                        )
                    )}

                  </div>

                  {/* ==================================================
                PREVIOUS BUTTON
              ================================================== */}

                  {images.length > 1 && (
                      <button
                          type="button"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            goPrevious();
                          }}
                          className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    z-30
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-full
                    bg-black/60
                    hover:bg-black/80
                    text-white
                    shadow-lg
                    cursor-pointer
                  "
                          aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                  )}

                  {/* ==================================================
                NEXT BUTTON
              ================================================== */}

                  {images.length > 1 && (
                      <button
                          type="button"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            goNext();
                          }}
                          className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    z-30
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-full
                    bg-black/60
                    hover:bg-black/80
                    text-white
                    shadow-lg
                    cursor-pointer
                  "
                          aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                  )}

                  {/* ==================================================
                IMAGE COUNTER
              ================================================== */}

                  {images.length > 1 && (
                      <div
                          className="
                    absolute
                    top-3
                    left-1/2
                    -translate-x-1/2
                    z-30
                    bg-black/60
                    text-white
                    text-xs
                    font-semibold
                    px-3
                    py-1
                    rounded-full
                    pointer-events-none
                  "
                      >
                        {currentImageIndex + 1} /{" "}
                        {images.length}
                      </div>
                  )}

                  {/* ==================================================
                DOTS
              ================================================== */}

                  {images.length > 1 && (
                      <div
                          className="
                    absolute
                    bottom-3
                    left-1/2
                    -translate-x-1/2
                    z-30
                    flex
                    items-center
                    gap-2
                  "
                      >
                        {images.map(
                            (image, index) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                    }}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();

                                      goToImage(index);
                                    }}
                                    aria-label={`Show image ${
                                        index + 1
                                    }`}
                                    className={`
                          cursor-pointer
                          rounded-full
                          border-0
                          p-0
                          transition-all
                          duration-300
                          ${
                                        index ===
                                        currentImageIndex
                                            ? "w-7 h-2 bg-white"
                                            : "w-2 h-2 bg-white/60 hover:bg-white"
                                    }
                        `}
                                />
                            )
                        )}
                      </div>
                  )}
                </>
            ) : (
                /* ====================================================
                  NO IMAGE FALLBACK
                ==================================================== */

                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {product.category.toLowerCase() ===
                  "chicken"
                      ? "🐔"
                      : "🐷"}
                </div>
            )}

            {/* ======================================================
            AVAILABLE BADGE
          ====================================================== */}

            {isAvailable && (
                <span
                    className="
                absolute
                top-3
                right-3
                z-40
                bg-green-500
                text-white
                text-xs
                font-bold
                px-2.5
                py-1
                rounded-full
                pointer-events-none
              "
                >
              Available
            </span>
            )}

            {/* ======================================================
            PRODUCT TYPE
          ====================================================== */}

            <span
                className="
              absolute
              top-3
              left-3
              z-40
              bg-[#1C0A00]/80
              text-white
              text-xs
              px-2.5
              py-1
              rounded-full
              capitalize
              pointer-events-none
            "
            >
            {product.productType}
          </span>

            {/* ======================================================
            UNAVAILABLE
          ====================================================== */}

            {!isAvailable && (
                <div
                    className="
                absolute
                inset-0
                bg-black/50
                flex
                items-center
                justify-center
                z-50
                pointer-events-none
              "
                >
              <span
                  className="
                  bg-red-600
                  text-white
                  text-xs
                  font-bold
                  px-3
                  py-1
                  rounded-full
                  uppercase
                  tracking-wider
                "
              >
                Unavailable
              </span>
                </div>
            )}
          </div>

          {/* ======================================================
          PRODUCT INFORMATION
        ====================================================== */}

          <div className="p-5 flex flex-col flex-1">

            {/* PRODUCT NAME */}

            <h3 className="font-display font-700 text-lg text-[#1C0A00] mb-1">
              {product.name}
            </h3>

            {/* DESCRIPTION */}

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
                    {[1, 2, 3].map(
                        (item) => (
                            <div
                                key={item}
                                className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse"
                            />
                        )
                    )}
                  </div>
                </div>
            ) : variants.length > 0 ? (
                <div className="mb-4">

                  <p className="text-xs font-semibold text-[#78350F] uppercase tracking-wider mb-2">
                    Select Size / Weight
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {variants.map(
                        (variant, index) => (
                            <button
                                key={variant.id}
                                type="button"
                                onClick={() =>
                                    setSelectedVariantIndex(
                                        index
                                    )
                                }
                                disabled={
                                  !variant.isAvailable
                                }
                                className={`
                        px-3
                        py-1.5
                        rounded-lg
                        text-xs
                        font-semibold
                        border
                        transition-colors
                        ${
                                    !variant.isAvailable
                                        ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                        : selectedVariantIndex ===
                                        index
                                            ? "bg-[#9B1C1C] text-white border-[#9B1C1C]"
                                            : "bg-white text-[#1C0A00] border-gray-200 hover:border-[#9B1C1C]"
                                }
                      `}
                            >
                              {[
                                variant.name,
                                variant.weightOrSize,
                              ]
                                  .filter(Boolean)
                                  .join(" · ")}
                            </button>
                        )
                    )}
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
            BUTTONS
          ==================================================== */}

            <div className="mt-auto space-y-2">

              {/* ADD TO CART */}

              <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                      !isAvailable ||
                      variantsLoading
                  }
                  className="
                w-full
                bg-[#EA580C]
                hover:bg-[#C2410C]
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-white
                font-semibold
                py-2.5
                px-3
                rounded-xl
                text-sm
                transition-colors
                flex
                items-center
                justify-center
                gap-2
              "
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

              {/* ORDER + ENQUIRE */}

              <div className="flex gap-2">

                <button
                    type="button"
                    onClick={() =>
                        setShowOrderModal(true)
                    }
                    disabled={!isAvailable}
                    className="
                  flex-1
                  bg-[#9B1C1C]
                  hover:bg-[#7F1515]
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  py-2.5
                  px-3
                  rounded-xl
                  text-sm
                  transition-colors
                "
                >
                  Order Now
                </button>

                <button
                    type="button"
                    onClick={handleEnquire}
                    className="
                  px-3
                  py-2.5
                  border
                  border-gray-200
                  hover:border-[#9B1C1C]
                  text-gray-500
                  hover:text-[#9B1C1C]
                  rounded-xl
                  text-sm
                  transition-colors
                "
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