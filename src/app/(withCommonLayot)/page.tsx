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
  Undo2,
  Redo2,
} from "lucide-react"; // Import icons
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";

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
  const [history, setHistory] = useState<ImageData[]>([]); // Canvas history for undo
  const [redoStack, setRedoStack] = useState<ImageData[]>([]); // Canvas history for redo

  // Function to determine button variant based on cursorType
  const getButtonVariant = (type: "pencil" | "text" | "eraser") => {
    return cursorType === type ? "default" : "secondary";
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev, imageData]);
        setRedoStack([]); // Clear the redo stack on new action
      }
    }
  };

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

  const saveCanvasToLocalStorage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      localStorage.setItem("canvasData", canvas.toDataURL());
    }
  };

  const loadCanvasFromLocalStorage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const savedData = localStorage.getItem("canvasData");
        if (savedData) {
          const img = new Image();
          img.src = savedData;
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
        }
      }
    }
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        // Set willReadFrequently attribute for optimization
        const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Set willReadFrequently
        if (ctx) {
          ctx.scale(ratio, ratio);
        }
        // Restore canvas content after resize
        loadCanvasFromLocalStorage();
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Load canvas content on initial render
    loadCanvasFromLocalStorage();

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    const finishTyping = () => {
      setIsTyping(false);
      setCurrentText("");
      setShowCursor(false); // Hide the cursor after text input is finished
      saveHistory(); // Save history after finishing typing
      saveCanvasToLocalStorage(); // Save canvas content on finish typing
    };
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
    if (cursorType === "pencil" || cursorType === "eraser") {
      setIsDrawing(true);
      setLastPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      saveHistory(); // Save history before drawing
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
        ctx.strokeStyle = "white";
        ctx.lineWidth = lineWidth * 2; // Eraser size is double the pencil size
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();

        setLastPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      }
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    saveCanvasToLocalStorage(); // Save canvas content after drawing
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvasToLocalStorage(); // Save canvas content after clearing
      }
    }
    const getDataFromLocalStroage = localStorage.getItem("canvasData");
    if (getDataFromLocalStroage) {
      localStorage.removeItem("canvasData");
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const newHistory = [...history];
          const lastState = newHistory.pop();
          setRedoStack((prev) => [
            ...prev,
            ctx.getImageData(0, 0, canvas.width, canvas.height),
          ]); // Save current state to redo stack
          setHistory(newHistory);
          if (lastState) {
            ctx.putImageData(lastState, 0, 0);
            saveCanvasToLocalStorage(); // Save canvas content after undo
          }
        }
      }
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const newRedoStack = [...redoStack];
          const lastState = newRedoStack.pop();
          setHistory((prev) => [
            ...prev,
            ctx.getImageData(0, 0, canvas.width, canvas.height),
          ]); // Save current state to history
          setRedoStack(newRedoStack);
          if (lastState) {
            ctx.putImageData(lastState, 0, 0);
            saveCanvasToLocalStorage(); // Save canvas content after redo
          }
        }
      }
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx && canvas) {
      if (isDarkTheme) {
        ctx.fillStyle = "#ffffff"; // White background for light theme
      } else {
        ctx.fillStyle = "#000000"; // Black background for dark theme
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className={`flex flex-col h-screen items-start justify-start p-2`}>
      <div className="flex flex-wrap gap-2">
        {/* Pencil Tool */}
        <Button
          variant={getButtonVariant("pencil")}
          onClick={() => setCursorType("pencil")}
        >
          <Pencil className="mr-2 h-4 w-4" /> Pencil
        </Button>

        {/* Text Tool */}
        <Button
          variant={getButtonVariant("text")}
          onClick={() => setCursorType("text")}
        >
          <Type className="mr-2 h-4 w-4" /> Text
        </Button>

        {/* Eraser Tool */}
        <Button
          variant={getButtonVariant("eraser")}
          onClick={() => setCursorType("eraser")}
        >
          <Eraser className="mr-2 h-4 w-4" /> Eraser
        </Button>

        {/* Bold Toggle */}
        <Toggle pressed={isBold} onPressedChange={setIsBold} className="ml-2">
          <Bold className="mr-2 h-4 w-4" />
        </Toggle>

        {/* Italic Toggle */}
        <Toggle
          pressed={isItalic}
          onPressedChange={setIsItalic}
          className="ml-2"
        >
          <Italic className="mr-2 h-4 w-4" />
        </Toggle>

        {/* Underline Toggle */}
        <Toggle
          pressed={isUnderline}
          onPressedChange={setIsUnderline}
          className="ml-2"
        >
          <Underline className="mr-2 h-4 w-4" />
        </Toggle>

        {/* Undo Button */}
        <Button variant="secondary" onClick={undo}>
          <Undo2 className="mr-2 h-4 w-4" /> Undo
        </Button>

        {/* Redo Button */}
        <Button variant="secondary" onClick={redo}>
          <Redo2 className="mr-2 h-4 w-4" /> Redo
        </Button>

        {/* Clear Canvas Button */}
        <Button variant="destructive" onClick={clearCanvas}>
          <Trash className="mr-2 h-4 w-4" /> Clear
        </Button>

        {/* Theme Toggle */}
        <Button variant="secondary" onClick={toggleTheme}>
          {isDarkTheme ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          {isDarkTheme ? "Dark" : "Light"} Theme
        </Button>

        {/* Font Size Input */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Font Size</Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <Input
              type="number"
              min={12}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </PopoverContent>
        </Popover>

        {/* Line Width Input */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Line Width</Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <Input
              type="number"
              min={1}
              max={10}
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </PopoverContent>
        </Popover>

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Color</Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border-none"
            />
          </PopoverContent>
        </Popover>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        className="mt-2 bg-white cursor-crosshair border-2 shadow-lg"
        style={{ borderColor: color }}
      />
    </div>
  );
}
