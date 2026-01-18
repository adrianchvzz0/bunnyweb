// src/components/HeroAnimation.jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

export default function HeroAnimation() {
    const textRef = useRef();
    const word2Ref = useRef();
    const pRef = useRef();
    const contactRef = useRef();

    useEffect(() => {
        const split = new SplitText(textRef.current, { type: "words" });
        const split2 = new SplitText(word2Ref.current, { type: "words" });
        const split3 = new SplitText(pRef.current, { type: "chars" });
        const tl = gsap.timeline();

        tl.from(split.words, {
            duration: 1,
            y: 20,

            filter: "blur(8px)",
            autoAlpha: 0,
        });
        tl.from(split2.words, {
            duration: 0.5,
            y: 20,

            filter: "blur(8px)",
            autoAlpha: 0,
        });
        tl.from(split3.chars, {
            duration: 0.5,
            y: 10,
            stagger: 0.02,
            filter: "blur(8px)",
            autoAlpha: 0,
        });
        tl.fromTo(
            contactRef.current,
            {
                y: 10,
                opacity: 0,
                scale: 0.9,
                filter: "blur(10px)",
            },
            {
                duration: .5,
                y: 0,
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                ease: "back.in",
            }
        );

    }, []);

    return (
        <div className="flex justify-center items-center flex-col">
            <h1 ref={textRef} className="text-white text-6xl lg:text-7xl font-bold">
                Bunny<span ref={word2Ref} className="text-[#00FFC4]">Web</span>
            </h1>
            <p ref={pRef} className="text-[#D0D0D4] mt-4 text-2xl md:text-4xl">
                Tu sitio web hecho a tu medida
            </p>
            <a
                ref={contactRef}
                href="#contact"
                className="group
                    text-white text-xl mt-4 border px-10 py-2 rounded-3xl hover:bg-gradient-to-br from-[#00FFC4] via-[#008D6C] to-[#00FFC4] transition-all hover:scale-105 duration-300"
            >
                Cotiza Ahora
            </a>
        </div>

    );
}
