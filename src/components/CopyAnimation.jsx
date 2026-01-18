import gsap from "gsap";
import { useEffect, useRef } from "react";

export default function CopyAnimation() {
    const copyRef = useRef();

    useEffect(() => {
        gsap.from(copyRef.current, {
            opacity: 0,
            y: 20,
            filter: "blur(8px)",
            duration: 0.5,
            ease: "power3.out",
        });
    }, []);

    return (

        <div
            ref={copyRef}
            id="toast"
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-6 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm transition-opacity duration-500 z-50"
        >
            Correo copiado al portapapeles
        </div>
    );
}