"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { QRCodeSVG } from "qrcode.react";
import { FRAMES } from "@/lib/framesConfig";

type Step = "WELCOME" | "HOME" | "PHOTO" | "FRAME" | "QR";

export default function PhotoboothApp() {
  const [step, setStep] = useState<Step>("WELCOME");
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // State Kamera & Sesi Foto (3 Pose)
  const [capturedPhotos, setCapturedPhotos] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [isReviewingShot, setIsReviewingShot] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // State Pemilihan Foto per Slot Bingkai
  const [slotSelections, setSlotSelections] = useState<number[]>([0, 1, 2]);

  // State Frame & Hasil Akhir
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [compositePreview, setCompositePreview] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string>("https://uinbanten.ac.id");
  const [finalImageBlobUrl, setFinalImageBlobUrl] = useState<string | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const webcamRef = useRef<Webcam>(null);
  const selectedFrame: any = FRAMES[selectedFrameIndex] || FRAMES[0];
  const frameSlotCount =
    selectedFrame.slots?.length || selectedFrame.totalSlots || 3;
  const allPhotosTaken = capturedPhotos.every((photo) => photo !== null);

  // Deteksi apakah perangkat menggunakan layar vertikal (HP)
  useEffect(() => {
    const checkOrientation = () => {
      setIsMobileView(window.innerWidth < window.innerHeight);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const triggerFullScreen = () => {
    if (typeof document !== "undefined" && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen ditolak browser:", err);
      });
    }
  };

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 250);

      setCapturedPhotos((prev) => {
        const updated = [...prev];
        updated[activeSlot] = imageSrc;
        return updated;
      });
      setIsReviewingShot(true);
    }
  }, [activeSlot]);

  useEffect(() => {
    if (step === "PHOTO" && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdown(null);
        capturePhoto();
      }
    }
  }, [step, countdown, capturePhoto]);

  const handleTakePhotoClick = () => {
    if (countdown !== null) return;

    if (isReviewingShot) {
      setIsReviewingShot(false);
      const nextEmptySlot = capturedPhotos.findIndex(
        (p, idx) => idx > activeSlot && p === null,
      );
      const anyEmptySlot = capturedPhotos.findIndex((p) => p === null);

      if (nextEmptySlot !== -1) {
        setActiveSlot(nextEmptySlot);
        setCountdown(3);
      } else if (anyEmptySlot !== -1) {
        setActiveSlot(anyEmptySlot);
        setCountdown(3);
      }
    } else if (!allPhotosTaken) {
      setCountdown(3);
    }
  };

  const handleRetakeClick = () => {
    if (countdown !== null) return;
    setIsReviewingShot(false);
    setCapturedPhotos((prev) => {
      const updated = [...prev];
      updated[activeSlot] = null;
      return updated;
    });
    setCountdown(3);
  };

  const loadImageSafe = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const renderCompositeCanvas = useCallback(
    async (
      frameObj: any,
      photos: (string | null)[],
      selections: number[],
    ): Promise<string | null> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const templateSrc =
        frameObj.url || frameObj.templateUrl || frameObj.image;
      const bgImg = templateSrc ? await loadImageSafe(templateSrc) : null;

      canvas.width = frameObj.width || bgImg?.naturalWidth || 1200;
      canvas.height = frameObj.height || bgImg?.naturalHeight || 1800;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const slots = frameObj.slots || [];
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const chosenPhotoIdx = selections[i] ?? i;
        const photoData = photos[chosenPhotoIdx];

        if (slot && photoData) {
          const pImg = await loadImageSafe(photoData);
          if (pImg) {
            ctx.save();
            ctx.translate(slot.x + slot.width, slot.y);
            ctx.scale(-1, 1);
            ctx.drawImage(pImg, 0, 0, slot.width, slot.height);
            ctx.restore();
          }
        }
      }

      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      }

      return canvas.toDataURL("image/png");
    },
    [],
  );

  useEffect(() => {
    if (step === "FRAME") {
      let isMounted = true;
      renderCompositeCanvas(selectedFrame, capturedPhotos, slotSelections).then(
        (dataUrl) => {
          if (isMounted && dataUrl) {
            setCompositePreview(dataUrl);
          }
        },
      );
      return () => {
        isMounted = false;
      };
    }
  }, [
    step,
    selectedFrame,
    capturedPhotos,
    slotSelections,
    renderCompositeCanvas,
  ]);

  const handlePrintAndGenerateQR = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const imageToUpload =
        compositePreview ||
        (await renderCompositeCanvas(
          selectedFrame,
          capturedPhotos,
          slotSelections,
        ));

      if (!imageToUpload) {
        alert("Gagal merakit foto, silakan coba lagi.");
        setIsProcessing(false);
        return;
      }

      setFinalImageBlobUrl(imageToUpload);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageToUpload }),
      });
      const data = await res.json();

      if (data.success && data.url) {
        setQrValue(data.url);
      } else {
        setQrValue(`${window.location.origin}/p/temp-${Date.now()}`);
      }
    } catch (error) {
      console.warn("API Upload error:", error);
      setQrValue(window.location.origin);
    } finally {
      setIsProcessing(false);
      setStep("QR");
    }
  };

  const resetSession = () => {
    setCapturedPhotos([null, null, null]);
    setSlotSelections([0, 1, 2]);
    setActiveSlot(0);
    setIsReviewingShot(false);
    setCountdown(null);
    setCompositePreview(null);
    setFinalImageBlobUrl(null);
    setQrValue("https://uinbanten.ac.id");
    setStep("WELCOME");
  };

  return (
    <main className="w-screen h-screen bg-black overflow-hidden select-none m-0 p-0 fixed inset-0 font-sans">
      <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <button
          onClick={triggerFullScreen}
          className="fixed top-3 left-3 z-50 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm transition cursor-pointer"
          title="Masuk Layar Penuh"
        >
          ⛶ Fullscreen
        </button>

        {/* ================= 1. WELCOME SCREEN ================= */}
        {step === "WELCOME" && (
          <div
            onClick={() => {
              triggerFullScreen();
              setStep("HOME");
            }}
            className="absolute inset-0 w-full h-full cursor-pointer z-40"
          >
            <img
              src={
                isMobileView
                  ? "/assets/welcome-phone-screen.png"
                  : "/assets/welcome-screen.png"
              }
              alt="Welcome Screen"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ================= 2. HOME SCREEN ================= */}
        {step === "HOME" && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={
                isMobileView
                  ? "/assets/phone-home-screen.png"
                  : "/assets/home-screen.png"
              }
              alt="Home Screen"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <div
              className={`relative z-20 w-full h-full flex flex-col justify-end items-center ${isMobileView ? "pb-[14%]" : "pb-[9%]"} px-4`}
            >
              <button
                onClick={() => setStep("PHOTO")}
                className="w-[80%] max-w-[320px] py-4 bg-[#F3B61F] hover:bg-[#e0a416] text-white font-black text-xl sm:text-3xl rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer tracking-wide"
              >
                Let&apos;s Start
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. PHOTO SCREEN ================= */}
        {step === "PHOTO" && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/assets/photo-screen.png"
              alt="Photo Screen Background"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <div className="relative z-20 w-full h-full flex flex-col lg:flex-row items-center justify-between px-[5%] py-[3%] gap-4 lg:gap-[5%] overflow-y-auto">
              <div className="w-full lg:w-[64%] h-full flex flex-col justify-center lg:justify-between items-center py-2">
                <div className="relative w-full aspect-[16/10] lg:h-[71%] bg-black rounded-[20px] border-[5px] sm:border-[6px] border-[#F3B61F] shadow-2xl overflow-hidden flex items-center justify-center">
                  {isReviewingShot && capturedPhotos[activeSlot] ? (
                    <>
                      <img
                        src={capturedPhotos[activeSlot]!}
                        alt={`Preview Foto ${activeSlot + 1}`}
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute top-3 left-3 bg-[#F3B61F] text-slate-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-lg">
                        Preview Foto {activeSlot + 1} — Klik Tombol jika Oke
                      </div>
                    </>
                  ) : (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        mirrored={true}
                        videoConstraints={{
                          facingMode: "user",
                          width: 1280,
                          height: 720,
                        }}
                        className="w-full h-full object-cover"
                      />
                      {!allPhotosTaken && countdown === null && (
                        <div className="absolute top-3 left-3 bg-black/75 text-[#F3B61F] font-bold text-xs sm:text-sm px-3.5 py-1 rounded-full border border-[#F3B61F]/50">
                          Pose ke-{activeSlot + 1} dari 3
                        </div>
                      )}
                    </>
                  )}

                  {isFlashing && (
                    <div className="absolute inset-0 bg-white z-30" />
                  )}

                  {countdown !== null && countdown > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <span className="text-7xl sm:text-9xl font-black text-[#F3B61F] drop-shadow-2xl animate-bounce">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col items-center justify-center gap-2.5 sm:gap-4 mt-3 lg:mt-0">
                  <div className="w-full flex items-center justify-center gap-4 sm:gap-8">
                    <button
                      onClick={handleTakePhotoClick}
                      disabled={
                        countdown !== null ||
                        (allPhotosTaken && !isReviewingShot)
                      }
                      className={`w-[42%] sm:w-[36%] py-2.5 sm:py-3.5 rounded-full font-extrabold text-sm sm:text-xl shadow-xl transition transform active:scale-95 ${
                        countdown !== null ||
                        (allPhotosTaken && !isReviewingShot)
                          ? "bg-[#F3B61F]/40 text-white/50 cursor-not-allowed"
                          : "bg-[#F3B61F] hover:bg-[#e0a416] text-white cursor-pointer hover:scale-105"
                      }`}
                    >
                      {isReviewingShot
                        ? activeSlot < 2
                          ? "Lanjut Foto ➔"
                          : "Konfirmasi Foto 3 ✓"
                        : "Take a Photo"}
                    </button>

                    <button
                      onClick={handleRetakeClick}
                      disabled={
                        countdown !== null ||
                        capturedPhotos[activeSlot] === null
                      }
                      className={`w-[42%] sm:w-[36%] py-2.5 sm:py-3.5 rounded-full font-extrabold text-sm sm:text-xl shadow-xl transition transform active:scale-95 ${
                        countdown !== null ||
                        capturedPhotos[activeSlot] === null
                          ? "bg-[#F3B61F]/40 text-white/50 cursor-not-allowed"
                          : "bg-[#F3B61F] hover:bg-[#e0a416] text-white cursor-pointer hover:scale-105"
                      }`}
                    >
                      Photo Ulang
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (allPhotosTaken && !isReviewingShot) {
                        setStep("FRAME");
                      }
                    }}
                    disabled={
                      !allPhotosTaken || isReviewingShot || countdown !== null
                    }
                    className={`w-[50%] sm:w-[38%] py-2.5 sm:py-3.5 rounded-full font-extrabold text-sm sm:text-xl shadow-xl transition transform ${
                      !allPhotosTaken || isReviewingShot || countdown !== null
                        ? "bg-[#F3B61F]/35 text-white/40 cursor-not-allowed"
                        : "bg-[#F3B61F] hover:bg-[#e0a416] text-white cursor-pointer hover:scale-105 active:scale-95 ring-4 ring-white animate-pulse"
                    }`}
                  >
                    Pilih Bingkai
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-[27%] h-[280px] lg:h-[88%] bg-[#F3B61F] rounded-[20px] p-3 flex lg:flex-col justify-between gap-3 shadow-2xl">
                {[0, 1, 2].map((slotIdx) => (
                  <div
                    key={slotIdx}
                    onClick={() => {
                      if (capturedPhotos[slotIdx] && countdown === null) {
                        setActiveSlot(slotIdx);
                        setIsReviewingShot(true);
                      }
                    }}
                    className={`w-full flex-1 bg-black rounded-[14px] overflow-hidden relative cursor-pointer transition flex items-center justify-center ${
                      activeSlot === slotIdx
                        ? "ring-4 ring-white"
                        : "hover:opacity-90"
                    }`}
                  >
                    {capturedPhotos[slotIdx] ? (
                      <img
                        src={capturedPhotos[slotIdx]!}
                        alt={`Slot Foto ${slotIdx + 1}`}
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <span className="text-white/25 font-bold text-xs sm:text-sm">
                        Foto {slotIdx + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. FRAME SCREEN ================= */}
        {step === "FRAME" && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/assets/frame-screen.png"
              alt="Frame Screen Background"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <div className="relative z-20 w-full h-full flex flex-col lg:flex-row items-center justify-between px-[5%] lg:px-[7%] py-[4%] lg:py-[5%] gap-4 lg:gap-[5%] overflow-y-auto">
              <div className="w-full lg:w-[31%] h-[380px] lg:h-[90%] flex items-center justify-center p-2">
                {compositePreview ? (
                  <img
                    src={compositePreview}
                    alt="Preview Hasil Bingkai"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border-4 border-[#F3B61F]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#F3B61F]">
                    <div className="w-8 h-8 border-4 border-[#F3B61F] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">
                      Merakit Bingkai...
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-[64%] h-full lg:h-[88%] flex flex-col items-center justify-between gap-4">
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFrameIndex(idx)}
                      className={`py-2.5 sm:py-3.5 px-2 rounded-full font-extrabold text-xs sm:text-sm transition transform cursor-pointer shadow-lg border-2 ${
                        selectedFrameIndex === idx
                          ? "bg-[#F3B61F] text-white border-white scale-105 ring-4 ring-white/40"
                          : "bg-[#F3B61F]/85 hover:bg-[#F3B61F] text-white border-black/30"
                      }`}
                    >
                      {FRAMES[idx]?.name || `Frame ${idx + 1}`}
                    </button>
                  ))}
                </div>

                <div className="w-full bg-[#F3B61F] rounded-[20px] border-2 border-black/40 p-4 sm:p-7 shadow-2xl flex flex-col justify-center gap-3 my-auto">
                  {[0, 1, 2].map((slotIdx) => {
                    const isSlotUsedInFrame = slotIdx < frameSlotCount;
                    return (
                      <div
                        key={slotIdx}
                        className={`flex items-center justify-between px-2 sm:px-5 py-1 rounded-xl transition ${
                          isSlotUsedInFrame
                            ? "opacity-100"
                            : "opacity-40 pointer-events-none"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-white font-black text-lg sm:text-2xl drop-shadow">
                            Slot {slotIdx + 1}
                          </span>
                          {!isSlotUsedInFrame && (
                            <span className="text-[10px] font-bold text-slate-900">
                              (Tidak terpakai)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                          {[0, 1, 2].map((photoOptionIdx) => {
                            const isSelected =
                              slotSelections[slotIdx] === photoOptionIdx;
                            return (
                              <button
                                key={photoOptionIdx}
                                type="button"
                                onClick={() => {
                                  setSlotSelections((prev) => {
                                    const updated = [...prev];
                                    updated[slotIdx] = photoOptionIdx;
                                    return updated;
                                  });
                                }}
                                className={`relative w-14 h-10 sm:w-22 sm:h-15 bg-black rounded-lg overflow-hidden transition transform cursor-pointer ${
                                  isSelected
                                    ? "ring-4 ring-white scale-110 shadow-xl z-10"
                                    : "opacity-70 hover:opacity-100 border border-black/40"
                                }`}
                                title={`Pilih Foto ${photoOptionIdx + 1} untuk Slot ${slotIdx + 1}`}
                              >
                                {capturedPhotos[photoOptionIdx] && (
                                  <img
                                    src={capturedPhotos[photoOptionIdx]!}
                                    alt={`Foto ${photoOptionIdx + 1}`}
                                    className="w-full h-full object-cover scale-x-[-1]"
                                  />
                                )}
                                <span
                                  className={`absolute bottom-0.5 right-1 text-[9px] font-black px-1 rounded ${
                                    isSelected
                                      ? "bg-[#F3B61F] text-slate-950"
                                      : "bg-black/70 text-white"
                                  }`}
                                >
                                  #{photoOptionIdx + 1}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handlePrintAndGenerateQR}
                  disabled={isProcessing}
                  className="px-12 sm:px-20 py-3 sm:py-4 bg-[#F3B61F] hover:bg-[#e0a416] text-white font-black text-base sm:text-xl rounded-full shadow-2xl border-2 border-white/40 transition transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3 mb-2 lg:mb-0"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses QR...
                    </>
                  ) : (
                    "Cetak Foto"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. QR SCREEN ================= */}
        {step === "QR" && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={
                isMobileView
                  ? "/assets/phone-qr-screen.png"
                  : "/assets/QR-screen.png"
              }
              alt="QR Screen Background"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center pointer-events-none p-4">
              <div className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] bg-[#F3B61F] rounded-[2.2rem] p-4 sm:p-6 shadow-2xl flex items-center justify-center mt-6 pointer-events-auto">
                <div className="w-full h-full bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-center shadow-inner">
                  <QRCodeSVG
                    value={qrValue}
                    className="w-full h-full"
                    level="H"
                  />
                </div>
              </div>

              {finalImageBlobUrl && (
                <a
                  href={finalImageBlobUrl}
                  download="photobooth-uin-banten.png"
                  className="mt-5 px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-xl pointer-events-auto transition active:scale-95 border-2 border-[#F3B61F]"
                >
                  📥 Download Gambar ke Perangkat
                </a>
              )}
            </div>

            <button
              onClick={resetSession}
              className="fixed top-4 right-4 bg-[#F3B61F] hover:bg-[#e0a416] text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xl border-2 border-white cursor-pointer active:scale-95 transition z-50"
            >
              Selesai / Foto Baru ↻
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
