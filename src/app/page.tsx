"use client";

import { useState, useCallback } from "react";
import { CardGrid } from "@/components/card-grid";
import { ShaderBackground } from "@/components/ui/shader-background";
import { Preloader } from "@/components/ui/preloader";

export default function Home() {
  const [isShaderLoaded, setIsShaderLoaded] = useState(false);

  const handleShaderLoad = useCallback(() => {
    setIsShaderLoaded(true);
  }, []);

  return (
    <>
      <Preloader isLoaded={isShaderLoaded} />
      <main className="relative min-h-screen overflow-hidden">
        <ShaderBackground onLoad={handleShaderLoad} />
        <div className="relative z-10">
          <CardGrid />
        </div>
      </main>
    </>
  );
}
