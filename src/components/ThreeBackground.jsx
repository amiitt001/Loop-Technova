import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';

// --- SHARED COMPONENTS ---

const FloatingBits = ({ color = "#00f3ff", count = 20 }) => {
    const group = useRef();
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.z = -t * 0.05;
            group.current.rotation.x = Math.sin(t * 0.1) * 0.1;
        }
    });

    return (
        <group ref={group}>
            {Array.from({ length: count }).map((_, i) => (
                <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
                    <mesh position={[
                        (Math.random() - 0.5) * 15,
                        (Math.random() - 0.5) * 15,
                        (Math.random() - 0.5) * 10
                    ]}>
                        <octahedronGeometry args={[Math.random() * 0.2]} />
                        <meshBasicMaterial color={color} wireframe={true} transparent opacity={0.3} />
                    </mesh>
                </Float>
            ))}
        </group>
    )
}

// --- VARIANTS ---

// 1. HOME: Tech Loop (Torus)
const TechLoop = () => {
    const meshRef = useRef();
    const particlesCount = 1500;
    const positions = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            const R = 3.5;
            const r = 1.2;
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const y = (R + r * Math.cos(v)) * Math.sin(u);
            const z = r * Math.sin(v) + Math.random() * 0.5;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.15;

            // Mouse Parallax
            meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, -state.pointer.x * 1.5, 0.1);
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -state.pointer.y * 1.5, 0.1);
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.03} color="#00f3ff" sizeAttenuation={true} transparent={true} opacity={0.8} blending={THREE.AdditiveBlending} />
        </points>
    );
};

// 2. EVENTS: Particle Flow (Galaxy Stream)
const ParticleFlow = () => {
    const meshRef = useRef();
    const count = 2000;

    // Initial positions
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20; // Wide X
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10; // Y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10; // Z
            spd[i] = 0.5 + Math.random() * 2; // Random speed
        }
        return [pos, spd];
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const positions = meshRef.current.geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            // Move left to right
            positions[i * 3] += speeds[i] * delta;

            // Reset if out of bounds
            if (positions[i * 3] > 10) {
                positions[i * 3] = -10;
            }
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true;

        // Interactive Sway
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, state.pointer.x * 0.2, 0.05);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -state.pointer.y * 2, 0.05);
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.04} color="#ff00ff" sizeAttenuation transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>
    )
}

// 3. TEAM: Network (Nodes and Lines)
const Network = () => {
    const group = useRef();
    const count = 30;

    const nodes = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: [
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 6
            ]
        }))
    }, []);

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = state.clock.getElapsedTime() * 0.05;

            // Interactive Rotation
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.2, 0.05);
            group.current.rotation.y += state.pointer.x * 0.01; // accelerating spin
        }
    })

    return (
        <group ref={group}>
            {nodes.map((node, i) => (
                <mesh key={i} position={node.position}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="#00ff88" />
                </mesh>
            ))}
            {/* Simple lines connecting close nodes could be complex, simple random connections here */}
            {nodes.map((node, i) => (
                i < count - 1 && (
                    <Line
                        key={`line-${i}`}
                        points={[node.position, nodes[i + 1].position]}
                        color="#00ff88"
                        lineWidth={0.5}
                        opacity={0.2}
                        transparent
                    />
                )
            ))}
            {/* Connect first to last to close loop somewhat */}
            <Line points={[nodes[0].position, nodes[count - 1].position]} color="#00ff88" lineWidth={0.5} opacity={0.2} transparent />
        </group>
    )
}

// 4. PROJECTS: Building Cubes
const Cubes = () => {
    const group = useRef();
    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.5, 0.05);
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.5, 0.05);
        }
    });

    return (
        <group ref={group}>
            {Array.from({ length: 40 }).map((_, i) => (
                <Float key={i} speed={1} rotationIntensity={1} floatIntensity={1} position={[
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 8
                ]}>
                    <mesh rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                        <boxGeometry args={[Math.random() * 0.8, Math.random() * 0.8, Math.random() * 0.8]} />
                        <meshStandardMaterial color={i % 2 === 0 ? "#ffaa00" : "#ff4400"} wireframe />
                    </mesh>
                </Float>
            ))}
        </group>
    )
}

// 5. JOIN: Vortex
const Vortex = () => {
    const meshRef = useRef();
    const count = 1000;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 4;
            const z = (Math.random() - 0.5) * 20;

            pos[i * 3] = Math.cos(angle) * radius;
            pos[i * 3 + 1] = Math.sin(angle) * radius;
            pos[i * 3 + 2] = z;
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.z += delta * 0.2;
            // spiral effect illusion

            // Move center based on mouse
            meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, state.pointer.x * 2, 0.05);
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, state.pointer.y * 2, 0.05);
        }
    })

    return (
        <points ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#bd00ff" sizeAttenuation transparent opacity={0.8} />
        </points>
    )
}

// 6. LEADERBOARD: Ascension (Golden)
const Ascension = () => {
    const meshRef = useRef();
    const count = 200;

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const speed = 0.02 + Math.random() / 50;
            const xFactor = (Math.random() - 0.5) * 25;
            const yFactor = (Math.random() - 0.5) * 25;
            const zFactor = (Math.random() - 0.5) * 25;
            const scale = 0.5 + Math.random() * 1.5;
            temp.push({ t, speed, xFactor, yFactor, zFactor, scale, my: yFactor });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        particles.forEach((particle, i) => {
            // Update time
            const t = particle.t += particle.speed;

            // Ascension: Continuous Upward movement
            particle.my += particle.speed * 2;
            if (particle.my > 12) particle.my = -12;

            const x = particle.xFactor + Math.sin(t) * 0.5;
            const y = particle.my;
            const z = particle.zFactor + Math.cos(t) * 0.5;

            dummy.position.set(x, y, z);
            dummy.scale.set(particle.scale, particle.scale, particle.scale);
            dummy.rotation.set(t, t * 0.5, 0);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;

        // Interactive Tilt
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -state.pointer.y * 0.1, 0.05);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, state.pointer.x * 0.1, 0.05);
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF8800" emissiveIntensity={0.4} transparent opacity={0.9} />
        </instancedMesh>
    )
}


const ThreeBackground = ({ variant = 'home' }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            opacity: 0.6,
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            <Canvas dpr={[1, 2]} eventSource={document.body} eventPrefix="client">
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
                <color attach="background" args={['#050505']} />

                {/* Fog adapts to variant slightly? */}
                <fog attach="fog" args={['#050505', 5, 20]} />

                {/* --- DYNAMIC SCENE CONTENT --- */}
                {variant === 'home' && (
                    <>
                        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                            <TechLoop />
                        </Float>
                        <FloatingBits />
                    </>
                )}

                {variant === 'events' && (
                    // Magenta/Purple Flow
                    <ParticleFlow />
                )}

                {variant === 'team' && (
                    // Green Network
                    <>
                        <Network />
                        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                    </>
                )}

                {variant === 'projects' && (
                    // Orange Cubes
                    <>
                        <Cubes />
                        <gridHelper args={[20, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
                    </>
                )}

                {variant === 'join' && (
                    // Purple Vortex
                    <Vortex />
                )}

                {variant === 'leaderboard' && (
                    // Rising shapes
                    <Ascension />
                )}


                {/* Global Stars (except for some variants that might clash or want clean look) */}
                {variant !== 'projects' && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}

                {/* Global Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
            </Canvas>
        </div>
    );
};

export default ThreeBackground;
