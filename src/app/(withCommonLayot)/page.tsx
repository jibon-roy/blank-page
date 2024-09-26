"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Type,
  Bold,
  Italic,
  Underline,
  Sun,
  Moon,
  Trash,
  Eraser,
} from "lucide-react"; // Import icons
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ArtBoard() {
  const [color, setColor] = useState("#000000");
  const [cursorType, setCursorType] = useState<"pencil" | "text" | "eraser">(
    "pencil"
  ); // Added eraser
  const [fontSize, setFontSize] = useState(16);
  const [lineWidth, setLineWidth] = useState(2); // For pencil radius
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [typingPosition, setTypingPosition] = useState({ x: 0, y: 0 });
  const [currentText, setCurrentText] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Theme state

  const drawText = useMemo(() => {
    return () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (ctx && isTyping) {
        ctx.font = `${isItalic ? "italic " : ""}${
          isBold ? "bold " : ""
        }${fontSize}px Arial`;
        ctx.fillStyle = color;

        // Clear the area where the text is being typed
        const textMetrics = ctx.measureText(currentText);
        ctx.clearRect(
          typingPosition.x,
          typingPosition.y - fontSize,
          textMetrics.width + fontSize, // Add extra space for the cursor
          fontSize * 1.2
        );

        ctx.fillText(currentText, typingPosition.x, typingPosition.y);

        if (isUnderline) {
          ctx.beginPath();
          ctx.moveTo(typingPosition.x, typingPosition.y + 3);
          ctx.lineTo(
            typingPosition.x + textMetrics.width,
            typingPosition.y + 3
          );
          ctx.stroke();
        }

        // Draw the blinking cursor
        if (showCursor) {
          ctx.fillRect(
            typingPosition.x + textMetrics.width,
            typingPosition.y - fontSize,
            2,
            fontSize // Changed to match font size
          );
        }
      }
    };
  }, [
    color,
    currentText,
    fontSize,
    isBold,
    isItalic,
    isTyping,
    isUnderline,
    showCursor,
    typingPosition.x,
    typingPosition.y,
  ]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(ratio, ratio);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isTyping) {
        if (e.key === "Enter") {
          finishTyping();
        } else if (e.key === "Backspace") {
          setCurrentText((prev) => prev.slice(0, -1));
        } else if (e.key.length === 1) {
          setCurrentText((prev) => prev + e.key);
        }
        drawText();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    isTyping,
    currentText,
    isBold,
    isItalic,
    isUnderline,
    fontSize,
    drawText,
  ]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 1000);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (isTyping) {
      drawText();
    }
  }, [drawText, isTyping, showCursor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cursorType === "pencil") {
      setIsDrawing(true);
      setLastPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    } else if (cursorType === "eraser") {
      setIsDrawing(true);
      setLastPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    } else if (cursorType === "text") {
      setIsTyping(true);
      setTypingPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      setCurrentText("");
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx) {
      if (cursorType === "pencil") {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();

        setLastPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      } else if (cursorType === "eraser") {
        ctx.clearRect(
          e.nativeEvent.offsetX - lineWidth / 2,
          e.nativeEvent.offsetY - lineWidth / 2,
          lineWidth,
          lineWidth
        );
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const finishTyping = () => {
    setIsTyping(false);
    setCurrentText("");
  };

  const eraseAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div
      className={`relative w-screen h-screen ${
        isDarkTheme ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div className="fixed top-4 right-4 z-10 flex items-center space-x-4">
        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[60px] h-[60px] p-0 rounded-full border-2"
              style={{ backgroundColor: color }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="flex flex-col space-y-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="font-mono"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Pencil and Text Mode */}
        <Button
          variant={cursorType === "pencil" ? "default" : "outline"}
          onClick={() => setCursorType("pencil")}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant={cursorType === "text" ? "default" : "outline"}
          onClick={() => setCursorType("text")}
        >
          <Type className="w-4 h-4" />
        </Button>

        {/* Eraser Mode */}
        <Button
          variant={cursorType === "eraser" ? "default" : "outline"}
          onClick={() => setCursorType("eraser")}
        >
          <Eraser className="w-4 h-4" />
        </Button>

        {/* Erase All */}
        <Button variant="outline" onClick={eraseAll}>
          <Trash className="w-4 h-4" />
        </Button>

        {/* Toggle Theme */}
        <Button variant="outline" onClick={() => setIsDarkTheme(!isDarkTheme)}>
          {isDarkTheme ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Pencil Radius */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Radius</Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="flex items-center space-x-2">
              <Input
                type="range"
                min={1}
                max={20}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
              />
              <span>{lineWidth}px</span>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
