"use client";

import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

// Smooth lerp helper
function damp(current, target, speed, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * dt));
}

// Preset skin tones: base, shadow, lip
const SKIN_TONES = {
  fair:   { base: "#f5d5b8", shadow: "#e4bda0", lip: "#d07870" },
  light:  { base: "#e8c4a8", shadow: "#d4a88a", lip: "#c07068" },
  medium: { base: "#c8966e", shadow: "#b07850", lip: "#a85848" },
  tan:    { base: "#a8784e", shadow: "#905a38", lip: "#905040" },
  dark:   { base: "#6b3e2e", shadow: "#502e20", lip: "#7a3828" },
  deep:   { base: "#3c2016", shadow: "#2a1408", lip: "#5a2818" },
};

function RealisticBody({ color, state, customization = {} }) {
  const groupRef = useRef();
  const headRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();
  const pupilLeftRef = useRef();
  const pupilRightRef = useRef();
  const upperLipRef = useRef();
  const lowerLipRef = useRef();
  const leftBrowRef = useRef();
  const rightBrowRef = useRef();
  const blinkRef = useRef(0);
  const mouthOpenRef = useRef(0);
  const headTiltRef = useRef({ x: 0, y: 0, z: 0 });
  const browRef = useRef(0);

  // Resolve customization options
  const skinPreset   = SKIN_TONES[customization.skinTone] || SKIN_TONES.light;
  const skinBase     = customization.skinColor || skinPreset.base;
  const skinShadow   = skinPreset.shadow;
  const resolvedLip  = customization.lipColor  || skinPreset.lip;
  const hairStyle     = customization.hairStyle     || "medium";
  const clothingStyle = customization.clothingStyle || "shirt";

  const resolvedHairColor = useMemo(() => {
    if (customization.hairColor) return new THREE.Color(customization.hairColor);
    const hc = new THREE.Color(color);
    hc.multiplyScalar(0.5);
    hc.offsetHSL(0, -0.15, -0.1);
    return hc;
  }, [customization.hairColor, color]);

  const eyeColorVal = useMemo(
    () => new THREE.Color(customization.eyeColor || color),
    [customization.eyeColor, color]
  );

  const resolvedClothColor = useMemo(
    () => customization.clothingColor
      ? new THREE.Color(customization.clothingColor)
      : new THREE.Color(color).multiplyScalar(0.35),
    [customization.clothingColor, color]
  );

  const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: skinBase,
    roughness: 0.55, metalness: 0.0,
    clearcoat: 0.08, clearcoatRoughness: 0.6,
    sheen: 0.4, sheenRoughness: 0.5,
    sheenColor: new THREE.Color(skinBase).lerp(new THREE.Color("#ffe0c8"), 0.4),
  }), [skinBase]);

  const skinMatDark = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: skinShadow,
    roughness: 0.6, metalness: 0.0,
    clearcoat: 0.05, sheen: 0.3, sheenRoughness: 0.5,
    sheenColor: new THREE.Color(skinShadow).lerp(new THREE.Color("#e8a080"), 0.3),
  }), [skinShadow]);

  const lipMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: resolvedLip,
    roughness: 0.35, metalness: 0.0,
    clearcoat: 0.3, clearcoatRoughness: 0.3,
    sheen: 0.6,
    sheenColor: new THREE.Color(resolvedLip).lerp(new THREE.Color("#ffb0a0"), 0.5),
  }), [resolvedLip]);

  const hairMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: resolvedHairColor,
    roughness: 0.45, metalness: 0.08,
    clearcoat: 0.15, clearcoatRoughness: 0.4,
    sheen: 0.8, sheenRoughness: 0.3,
    sheenColor: resolvedHairColor.clone().lerp(new THREE.Color(color), 0.4),
  }), [resolvedHairColor, color]);

  const clothMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: resolvedClothColor,
    roughness: 0.75, metalness: 0.0,
    sheen: 0.2, sheenRoughness: 0.8,
    sheenColor: resolvedClothColor.clone().lerp(new THREE.Color(color), 0.3),
  }), [resolvedClothColor, color]);

  const irisMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: eyeColorVal,
    roughness: 0.15, metalness: 0.1,
    clearcoat: 0.8, clearcoatRoughness: 0.1,
    emissive: eyeColorVal, emissiveIntensity: 0.15,
  }), [eyeColorVal]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    // Breathing - subtle chest/shoulder rise
    const breathe = Math.sin(t * 1.0) * 0.008;
    groupRef.current.position.y = breathe * 0.5;

    // Very subtle body sway
    groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.008;
    groupRef.current.rotation.y = Math.sin(t * 0.18) * 0.015;

    // Head movement - smooth and natural
    const targetX = state === "thinking"
      ? -0.06 + Math.sin(t * 0.4) * 0.02
      : Math.sin(t * 0.3 + 0.5) * 0.025;
    const targetY = state === "thinking"
      ? Math.sin(t * 0.35) * 0.06
      : Math.sin(t * 0.22) * 0.03;
    const targetZ = Math.sin(t * 0.28) * 0.015;

    headTiltRef.current.x = damp(headTiltRef.current.x, targetX, 2, delta);
    headTiltRef.current.y = damp(headTiltRef.current.y, targetY, 2, delta);
    headTiltRef.current.z = damp(headTiltRef.current.z, targetZ, 2, delta);

    if (headRef.current) {
      headRef.current.rotation.x = headTiltRef.current.x;
      headRef.current.rotation.y = headTiltRef.current.y;
      headRef.current.rotation.z = headTiltRef.current.z;
    }

    // Blinking - smooth, natural timing with double-blinks
    const blinkCycle = t % 5;
    let targetBlink = 0;
    if (blinkCycle > 4.0 && blinkCycle < 4.15) targetBlink = 1;
    if (blinkCycle > 4.3 && blinkCycle < 4.42) targetBlink = 1; // double blink
    blinkRef.current = damp(blinkRef.current, targetBlink, 18, delta);

    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = 1 - blinkRef.current * 0.9;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = 1 - blinkRef.current * 0.9;

    // Pupil micro-movements (saccades)
    const pupilX = Math.sin(t * 0.7) * 0.003 + Math.sin(t * 2.1) * 0.001;
    const pupilY = Math.cos(t * 0.5) * 0.002;
    if (pupilLeftRef.current) {
      pupilLeftRef.current.position.x = -0.115 + pupilX;
      pupilLeftRef.current.position.y = 0.04 + pupilY;
    }
    if (pupilRightRef.current) {
      pupilRightRef.current.position.x = 0.115 + pupilX;
      pupilRightRef.current.position.y = 0.04 + pupilY;
    }

    // Mouth animation
    let targetMouth = 0;
    if (state === "streaming") {
      targetMouth = 0.3 + Math.sin(t * 10) * 0.2 + Math.sin(t * 7.3) * 0.1;
    }
    mouthOpenRef.current = damp(mouthOpenRef.current, targetMouth, 8, delta);

    if (lowerLipRef.current) {
      lowerLipRef.current.position.y = -0.15 - mouthOpenRef.current * 0.03;
    }
    if (upperLipRef.current) {
      upperLipRef.current.position.y = -0.1 + mouthOpenRef.current * 0.005;
    }

    // Eyebrow expression
    const targetBrow = state === "thinking" ? 0.012 : 0;
    browRef.current = damp(browRef.current, targetBrow, 3, delta);
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = 0.12 + browRef.current;
      leftBrowRef.current.rotation.z = 0.08 + (state === "thinking" ? 0.05 : 0);
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = 0.12 + browRef.current;
      rightBrowRef.current.rotation.z = -0.08 - (state === "thinking" ? 0.05 : 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* === UPPER BODY (clothing style) === */}
      {clothingStyle === "jacket" ? (
        <>
          <mesh position={[0, -0.65, 0]}>
            <capsuleGeometry args={[0.38, 0.5, 32, 32]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          {/* Lapels */}
          <mesh position={[-0.1, -0.22, 0.14]} rotation={[0.2, 0.2, 0.3]} scale={[0.5, 1, 0.4]}>
            <capsuleGeometry args={[0.04, 0.25, 12, 12]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.1, -0.22, 0.14]} rotation={[0.2, -0.2, -0.3]} scale={[0.5, 1, 0.4]}>
            <capsuleGeometry args={[0.04, 0.25, 12, 12]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.44, -0.28, 0]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.44, -0.28, 0]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.52, -0.55, 0]} rotation={[0.05, 0, 0.12]}>
            <capsuleGeometry args={[0.11, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.52, -0.55, 0]} rotation={[0.05, 0, -0.12]}>
            <capsuleGeometry args={[0.11, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
        </>
      ) : clothingStyle === "turtleneck" ? (
        <>
          <mesh position={[0, -0.65, 0]}>
            <capsuleGeometry args={[0.38, 0.5, 32, 32]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.42, 28]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.42, -0.3, 0]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.42, -0.3, 0]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.5, -0.55, 0]} rotation={[0.05, 0, 0.12]}>
            <capsuleGeometry args={[0.1, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.5, -0.55, 0]} rotation={[0.05, 0, -0.12]}>
            <capsuleGeometry args={[0.1, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, -0.65, 0]}>
            <capsuleGeometry args={[0.38, 0.5, 32, 32]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.42, -0.3, 0]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.42, -0.3, 0]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[-0.5, -0.55, 0]} rotation={[0.05, 0, 0.12]}>
            <capsuleGeometry args={[0.1, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0.5, -0.55, 0]} rotation={[0.05, 0, -0.12]}>
            <capsuleGeometry args={[0.1, 0.3, 16, 16]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.22, 0.05]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 16, 32]} />
            <primitive object={clothMat} attach="material" />
          </mesh>
        </>
      )}

      {/* Neck — hidden by turtleneck */}
      {clothingStyle !== "turtleneck" && (
        <>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 0.25, 24]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[-0.06, -0.08, 0.06]} rotation={[0.1, 0, 0.08]}>
            <capsuleGeometry args={[0.015, 0.15, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.06, -0.08, 0.06]} rotation={[0.1, 0, -0.08]}>
            <capsuleGeometry args={[0.015, 0.15, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </>
      )}

      {/* === HEAD === */}
      <group ref={headRef} position={[0, 0.22, 0]}>
        {/* Cranium - slightly elongated */}
        <mesh position={[0, 0.05, -0.02]}>
          <sphereGeometry args={[0.24, 48, 48]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Jaw / Lower face */}
        <mesh position={[0, -0.08, 0.04]} scale={[0.88, 0.7, 0.85]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Chin */}
        <mesh position={[0, -0.19, 0.1]}>
          <sphereGeometry args={[0.065, 24, 24]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Cheekbones */}
        <mesh position={[-0.15, -0.02, 0.15]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        <mesh position={[0.15, -0.02, 0.15]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Brow ridge */}
        <mesh position={[0, 0.1, 0.17]} scale={[1.3, 0.4, 0.6]}>
          <sphereGeometry args={[0.08, 24, 16]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* === NOSE === */}
        {/* Nose bridge */}
        <mesh position={[0, 0.02, 0.2]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.018, 0.08, 12, 12]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        {/* Nose tip */}
        <mesh position={[0, -0.04, 0.23]}>
          <sphereGeometry args={[0.028, 20, 20]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.02, -0.055, 0.215]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <primitive object={skinMatDark} attach="material" />
        </mesh>
        <mesh position={[0.02, -0.055, 0.215]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <primitive object={skinMatDark} attach="material" />
        </mesh>

        {/* === EYES === */}
        {/* Eye sockets (subtle indentation) */}
        <mesh position={[-0.08, 0.05, 0.16]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={skinMatDark} attach="material" />
        </mesh>
        <mesh position={[0.08, 0.05, 0.16]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={skinMatDark} attach="material" />
        </mesh>

        {/* Left Eye group */}
        <group ref={eyeLeftRef}>
          {/* Sclera */}
          <mesh position={[-0.085, 0.04, 0.19]} scale={[1.15, 0.85, 0.8]}>
            <sphereGeometry args={[0.038, 24, 24]} />
            <meshPhysicalMaterial color="#faf8f5" roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
          </mesh>
          {/* Iris */}
          <mesh ref={pupilLeftRef} position={[-0.085, 0.04, 0.215]}>
            <circleGeometry args={[0.02, 32]} />
            <primitive object={irisMat} attach="material" />
          </mesh>
          {/* Pupil */}
          <mesh position={[-0.085, 0.04, 0.2165]}>
            <circleGeometry args={[0.009, 24]} />
            <meshStandardMaterial color="#0a0a12" roughness={0.1} />
          </mesh>
          {/* Specular highlight */}
          <mesh position={[-0.078, 0.048, 0.218]}>
            <circleGeometry args={[0.005, 12]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Right Eye group */}
        <group ref={eyeRightRef}>
          <mesh position={[0.085, 0.04, 0.19]} scale={[1.15, 0.85, 0.8]}>
            <sphereGeometry args={[0.038, 24, 24]} />
            <meshPhysicalMaterial color="#faf8f5" roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
          </mesh>
          <mesh ref={pupilRightRef} position={[0.085, 0.04, 0.215]}>
            <circleGeometry args={[0.02, 32]} />
            <primitive object={irisMat} attach="material" />
          </mesh>
          <mesh position={[0.085, 0.04, 0.2165]}>
            <circleGeometry args={[0.009, 24]} />
            <meshStandardMaterial color="#0a0a12" roughness={0.1} />
          </mesh>
          <mesh position={[0.092, 0.048, 0.218]}>
            <circleGeometry args={[0.005, 12]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Eyelids (upper) */}
        <mesh position={[-0.085, 0.065, 0.19]} scale={[1.2, 0.3, 0.85]} rotation={[0.15, 0, 0]}>
          <sphereGeometry args={[0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        <mesh position={[0.085, 0.065, 0.19]} scale={[1.2, 0.3, 0.85]} rotation={[0.15, 0, 0]}>
          <sphereGeometry args={[0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Eyelashes (subtle dark lines) */}
        <mesh position={[-0.085, 0.062, 0.205]} scale={[1.25, 0.12, 0.5]} rotation={[0.1, 0, 0]}>
          <sphereGeometry args={[0.035, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#1a1520" roughness={0.8} />
        </mesh>
        <mesh position={[0.085, 0.062, 0.205]} scale={[1.25, 0.12, 0.5]} rotation={[0.1, 0, 0]}>
          <sphereGeometry args={[0.035, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#1a1520" roughness={0.8} />
        </mesh>

        {/* === EYEBROWS (match hair color) === */}
        <mesh ref={leftBrowRef} position={[-0.09, 0.12, 0.18]} rotation={[0.3, 0, 0.08]} scale={[1, 0.35, 0.5]}>
          <capsuleGeometry args={[0.015, 0.06, 12, 12]} />
          <meshStandardMaterial color={resolvedHairColor} roughness={0.9} />
        </mesh>
        <mesh ref={rightBrowRef} position={[0.09, 0.12, 0.18]} rotation={[0.3, 0, -0.08]} scale={[1, 0.35, 0.5]}>
          <capsuleGeometry args={[0.015, 0.06, 12, 12]} />
          <meshStandardMaterial color={resolvedHairColor} roughness={0.9} />
        </mesh>

        {/* === LIPS === */}
        {/* Upper lip */}
        <mesh ref={upperLipRef} position={[0, -0.1, 0.2]} scale={[1.1, 0.55, 0.7]}>
          <sphereGeometry args={[0.032, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <primitive object={lipMat} attach="material" />
        </mesh>
        {/* Cupid's bow detail */}
        <mesh position={[0, -0.095, 0.215]} scale={[0.5, 0.2, 0.4]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <primitive object={lipMat} attach="material" />
        </mesh>
        {/* Lower lip */}
        <mesh ref={lowerLipRef} position={[0, -0.12, 0.195]} scale={[1, 0.5, 0.65]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.035, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <primitive object={lipMat} attach="material" />
        </mesh>

        {/* === EARS === */}
        <group position={[-0.22, 0.02, 0]}>
          <mesh rotation={[0, -0.3, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, -0.01]} rotation={[0, -0.3, 0]} scale={[0.6, 1, 0.3]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <primitive object={skinMatDark} attach="material" />
          </mesh>
        </group>
        <group position={[0.22, 0.02, 0]}>
          <mesh rotation={[0, 0.3, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, -0.01]} rotation={[0, 0.3, 0]} scale={[0.6, 1, 0.3]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <primitive object={skinMatDark} attach="material" />
          </mesh>
        </group>

        {/* === HAIR (style-specific) === */}
        {hairStyle === "short" ? (
          <>
            <mesh position={[0, 0.14, -0.03]} scale={[1.02, 0.78, 1.0]}>
              <sphereGeometry args={[0.26, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.18, -0.01]} scale={[0.95, 0.7, 0.9]}>
              <sphereGeometry args={[0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.04, -0.16]} scale={[0.9, 0.85, 0.7]}>
              <sphereGeometry args={[0.2, 32, 32]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.18, 0.0, 0.05]} rotation={[0.1, 0, 0.1]} scale={[0.7, 0.8, 0.8]}>
              <capsuleGeometry args={[0.04, 0.16, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.18, 0.0, 0.05]} rotation={[0.1, 0, -0.1]} scale={[0.7, 0.8, 0.8]}>
              <capsuleGeometry args={[0.04, 0.16, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
          </>
        ) : hairStyle === "long" ? (
          <>
            <mesh position={[0, 0.12, -0.04]} scale={[1.06, 1.05, 1.06]}>
              <sphereGeometry args={[0.26, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.18, -0.02]}>
              <sphereGeometry args={[0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.25, -0.18]} scale={[0.9, 1.2, 0.72]}>
              <capsuleGeometry args={[0.14, 0.55, 24, 24]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.22, -0.18, 0.04]} rotation={[0.05, 0, 0.18]}>
              <capsuleGeometry args={[0.045, 0.55, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.22, -0.18, 0.04]} rotation={[0.05, 0, -0.18]}>
              <capsuleGeometry args={[0.045, 0.55, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.07, 0.13, 0.16]} rotation={[0.5, 0.1, 0.2]} scale={[0.8, 0.4, 0.6]}>
              <capsuleGeometry args={[0.03, 0.08, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.04, 0.14, 0.17]} rotation={[0.6, -0.05, -0.1]} scale={[0.7, 0.35, 0.55]}>
              <capsuleGeometry args={[0.028, 0.07, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
          </>
        ) : hairStyle === "wavy" ? (
          <>
            <mesh position={[0, 0.13, -0.04]} scale={[1.06, 1.02, 1.06]}>
              <sphereGeometry args={[0.26, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.18, -0.02]}>
              <sphereGeometry args={[0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.21, -0.12, -0.04]} rotation={[-0.1, 0.15, 0.25]} scale={[0.7, 0.8, 0.7]}>
              <torusGeometry args={[0.08, 0.035, 10, 28, Math.PI * 1.2]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.21, -0.12, -0.04]} rotation={[-0.1, -0.15, -0.25]} scale={[0.7, 0.8, 0.7]}>
              <torusGeometry args={[0.08, 0.035, 10, 28, Math.PI * 1.2]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.19, -0.22, 0.03]} rotation={[0.1, 0, 0.2]} scale={[0.65, 1, 0.6]}>
              <capsuleGeometry args={[0.04, 0.28, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.19, -0.22, 0.03]} rotation={[0.1, 0, -0.2]} scale={[0.65, 1, 0.6]}>
              <capsuleGeometry args={[0.04, 0.28, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.1, -0.38, -0.06]} rotation={[0.4, 0.2, 0.3]} scale={[0.7, 0.6, 0.55]}>
              <torusGeometry args={[0.07, 0.03, 8, 24, Math.PI * 1.4]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.1, -0.38, -0.06]} rotation={[0.4, -0.2, -0.3]} scale={[0.7, 0.6, 0.55]}>
              <torusGeometry args={[0.07, 0.03, 8, 24, Math.PI * 1.4]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.07, 0.13, 0.16]} rotation={[0.5, 0.1, 0.2]} scale={[0.8, 0.4, 0.6]}>
              <capsuleGeometry args={[0.03, 0.08, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.04, 0.14, 0.17]} rotation={[0.6, -0.05, -0.1]} scale={[0.7, 0.35, 0.55]}>
              <capsuleGeometry args={[0.028, 0.07, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 0.12, -0.04]} scale={[1.05, 1, 1.05]}>
              <sphereGeometry args={[0.26, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.18, -0.02]}>
              <sphereGeometry args={[0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.02, -0.14]} scale={[0.95, 1.1, 0.8]}>
              <sphereGeometry args={[0.22, 32, 32]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.2, -0.02, 0.06]} rotation={[0.1, 0, 0.15]}>
              <capsuleGeometry args={[0.04, 0.22, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.2, -0.02, 0.06]} rotation={[0.1, 0, -0.15]}>
              <capsuleGeometry args={[0.04, 0.22, 16, 16]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.06, 0.13, 0.16]} rotation={[0.5, 0.1, 0.2]} scale={[0.8, 0.4, 0.6]}>
              <capsuleGeometry args={[0.03, 0.08, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0.04, 0.14, 0.17]} rotation={[0.6, -0.05, -0.1]} scale={[0.7, 0.35, 0.55]}>
              <capsuleGeometry args={[0.028, 0.07, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[-0.02, 0.15, 0.15]} rotation={[0.4, 0, 0.05]} scale={[0.9, 0.35, 0.6]}>
              <capsuleGeometry args={[0.032, 0.06, 12, 12]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
          </>
        )}

        {/* Hair highlight */}
        <mesh position={[0.1, 0.15, 0.08]} rotation={[0.3, -0.2, -0.3]} scale={[0.5, 0.25, 0.4]}>
          <capsuleGeometry args={[0.025, 0.1, 8, 8]} />
          <meshPhysicalMaterial
            color={resolvedHairColor.clone().lerp(new THREE.Color("#ffffff"), 0.3)}
            roughness={0.3} metalness={0.1} clearcoat={0.3}
            emissive={resolvedHairColor} emissiveIntensity={0.08}
          />
        </mesh>
      </group>
    </group>
  );
}

function Particles({ color, count = 20 }) {
  const meshRef = useRef();
  const particleColor = useMemo(() => new THREE.Color(color), [color]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  const speeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      speed: 0.15 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    })), [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const s = speeds[i];
      posArray[i * 3] += Math.sin(t * s.speed + s.offset) * 0.001;
      posArray[i * 3 + 1] += 0.001;
      if (posArray[i * 3 + 1] > 2) posArray[i * 3 + 1] = -1.5;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geo}>
      <pointsMaterial
        size={0.02}
        color={particleColor}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function GlowRing({ color }) {
  const ref = useRef();
  const ringColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.getElapsedTime() * 0.2;
    ref.current.material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.06;
  });

  return (
    <mesh ref={ref} position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.55, 0.015, 8, 64]} />
      <meshStandardMaterial
        color={ringColor}
        emissive={ringColor}
        emissiveIntensity={1.5}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Avatar3D({ color = "#4a8fc0", state = "idle", customization = {} }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 8,
      }}>
        <div style={{ fontSize: 64, filter: `drop-shadow(0 0 12px ${color}66)` }}>🤖</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: 2, color, textTransform: "uppercase", opacity: 0.6,
        }}>
          {state === "thinking" ? "thinking..." : state === "streaming" ? "speaking" : "online"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0.15, 2.2], fov: 30 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        onError={() => setHasError(true)}
      >
        {/* Lights always render — no Suspense needed */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[2.5, 3, 4]} intensity={1.2} color="#fff5e8" />
        <directionalLight position={[-3, 2, 2]} intensity={0.5} color="#c8d8f8" />
        <directionalLight position={[0, 2, -4]} intensity={0.8} color="#a0b8e0" />
        <pointLight position={[0, -1, 2]} intensity={0.2} color="#e8d0c8" />
        <pointLight position={[1, 0.5, 1.5]} intensity={0.3} color={color} />
        <hemisphereLight args={["#c8d8f0", "#18243a", 0.35]} />

        {/* Avatar mesh — own Suspense so it renders independently of Environment */}
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.15} floatingRange={[-0.02, 0.02]}>
            <RealisticBody color={color} state={state} customization={customization} />
          </Float>
          <Particles color={color} count={18} />
          <GlowRing color={color} />
          <ContactShadows position={[0, -1.3, 0]} opacity={0.3} scale={2.5} blur={3} far={2} color="#000020" />
        </Suspense>

        {/* Environment in its own Suspense — won't block avatar render if HDR is slow/unavailable */}
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.3} />
        </Suspense>
      </Canvas>

      <div style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: 2,
        color: color,
        textTransform: "uppercase",
        opacity: state === "idle" ? 0.4 : 0.8,
        transition: "opacity 0.3s",
        whiteSpace: "nowrap",
        textShadow: `0 0 10px ${color}66`,
      }}>
        {state === "thinking" ? "thinking..." : state === "streaming" ? "speaking" : "online"}
      </div>
    </div>
  );
}
