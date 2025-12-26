"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: "twitter" | "youtube";
}

const SCHEDULE_OPTIONS = [
  { value: "every_5_min", label: "Every 5 minutes" },
  { value: "every_10_min", label: "Every 10 minutes" },
  { value: "every_30_min", label: "Every 30 minutes" },
  { value: "every_hour", label: "Every hour" },
  { value: "every_3_hours", label: "Every 3 hours" },
  { value: "every_6_hours", label: "Every 6 hours" },
];

function ModalButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const defaultShadow =
    "0 0px 0px rgba(0,0,0,0), inset 0 1px 2px rgba(0,0,0,0.2), inset 0 0px 0px rgba(255,255,255,0)";
  const hoverShadow =
    "0 2px 8px rgba(0,0,0,0.3), inset 0 0px 0px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.1)";

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium"
      style={{
        color: disabled
          ? "rgba(255,255,255,0.3)"
          : isHovered
            ? "rgba(255,255,255,1)"
            : isPrimary
              ? "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.5)",
        backgroundColor: disabled
          ? "rgba(255,255,255,0.02)"
          : isPressed
            ? "rgba(255,255,255,0.05)"
            : isHovered
              ? "rgba(255,255,255,0.15)"
              : isPrimary
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.05)",
        boxShadow: isHovered && !disabled ? hoverShadow : defaultShadow,
        transform: isPressed && !disabled ? "scale(0.98)" : "scale(1)",
        transition:
          "color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </button>
  );
}

function IconButton({
  icon,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const defaultShadow =
    "0 0px 0px rgba(0,0,0,0), inset 0 1px 2px rgba(0,0,0,0.2), inset 0 0px 0px rgba(255,255,255,0)";
  const hoverShadow =
    "0 2px 8px rgba(0,0,0,0.3), inset 0 0px 0px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.1)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg p-2"
      style={{
        color: isHovered ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)",
        backgroundColor: isPressed
          ? "rgba(255,255,255,0.05)"
          : isHovered
            ? "rgba(255,255,255,0.1)"
            : "rgba(255,255,255,0)",
        boxShadow: isHovered ? hoverShadow : defaultShadow,
        transform: isPressed ? "scale(0.95)" : "scale(1)",
        transition:
          "color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  platform,
}: SettingsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [schedule, setSchedule] = useState("every_hour");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownHovered, setDropdownHovered] = useState<string | null>(null);
  const [isDropdownButtonHovered, setIsDropdownButtonHovered] = useState(false);

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return;
    }
    setIsVisible(false);
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && platform === "twitter") {
      setIsLoading(true);
      fetch("/api/twitter/configuration")
        .then((res) => {
          if (!res.ok) throw new Error("API error");
          return res.json();
        })
        .then((data) => {
          if (data.searchTerm !== undefined) {
            setSearchTerm(data.searchTerm);
          }
          if (data.schedule) {
            setSchedule(data.schedule);
          }
        })
        .catch(() => {
          // Database not available - use defaults
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, platform]);

  const handleSave = async () => {
    if (platform !== "twitter") return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/twitter/configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm, schedule }),
      });

      if (!res.ok) {
        throw new Error("Failed to save configuration");
      }

      onClose();
    } catch (err) {
      console.error("Failed to save configuration:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!shouldRender) return null;

  const selectedScheduleLabel =
    SCHEDULE_OPTIONS.find((opt) => opt.value === schedule)?.label ??
    "Select schedule";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease-out",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          borderColor: "rgba(255,255,255,0.1)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
          transform: isVisible
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(10px)",
          transition: "transform 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold tracking-wide text-white/90">
            {platform === "twitter" ? "Twitter" : "YouTube"} Settings
          </h2>
          <IconButton
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
            label="Close"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading overlay with fade */}
          <div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
            style={{
              opacity: isLoading ? 1 : 0,
              transition: "opacity 0.2s ease-out",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div>

          {/* Content with fade */}
          <div
            style={{
              opacity: isLoading ? 0.3 : 1,
              transition: "opacity 0.2s ease-out",
            }}
          >
            <>
              {/* Search Term Input - Twitter only */}
              {platform === "twitter" && (
                <div className="mb-5">
                  <label
                    htmlFor="searchTerm"
                    className="mb-2 block text-sm font-semibold tracking-wide text-white/90"
                  >
                    Search Term
                  </label>
                  <input
                    id="searchTerm"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter search term..."
                    className="w-full rounded-lg border px-4 py-3 text-white/90 outline-none backdrop-blur-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.1)",
                      transition:
                        "border-color 0.3s ease, background 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.3)";
                      e.target.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      e.target.style.background = "rgba(255,255,255,0.05)";
                    }}
                  />
                </div>
              )}

              {/* Schedule Dropdown */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold tracking-wide text-white/90">
                  Schedule
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onMouseEnter={() => setIsDropdownButtonHovered(true)}
                    onMouseLeave={() => setIsDropdownButtonHovered(false)}
                    className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left backdrop-blur-xl"
                    style={{
                      background: isDropdownButtonHovered
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.05)",
                      borderColor: isDropdownOpen
                        ? "rgba(255,255,255,0.3)"
                        : isDropdownButtonHovered
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(255,255,255,0.1)",
                      transition:
                        "border-color 0.3s ease, background 0.3s ease",
                    }}
                  >
                    <span className="text-white/90">
                      {selectedScheduleLabel}
                    </span>
                    <ChevronDown
                      className="h-5 w-5 text-white/50"
                      style={{
                        transform: isDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                      }}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border backdrop-blur-xl"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)",
                        borderColor: "rgba(255,255,255,0.15)",
                        boxShadow:
                          "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      {SCHEDULE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSchedule(option.value);
                            setIsDropdownOpen(false);
                          }}
                          onMouseEnter={() => setDropdownHovered(option.value)}
                          onMouseLeave={() => setDropdownHovered(null)}
                          className="w-full px-4 py-3 text-left"
                          style={{
                            color:
                              schedule === option.value ||
                              dropdownHovered === option.value
                                ? "rgba(255,255,255,1)"
                                : "rgba(255,255,255,0.5)",
                            backgroundColor:
                              schedule === option.value
                                ? "rgba(255,255,255,0.1)"
                                : dropdownHovered === option.value
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent",
                            transition:
                              "color 0.3s ease, background-color 0.3s ease",
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-white/10 pt-6">
                <ModalButton onClick={onClose} variant="secondary">
                  Cancel
                </ModalButton>
                <ModalButton
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </ModalButton>
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}
