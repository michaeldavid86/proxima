// Simple star backdrop using drei's <Stars> component.
import { Stars } from '@react-three/drei'

export default function Starfield3D() {
  return (
    <Stars
      radius={300}
      depth={80}
      count={3500}
      factor={2.2}
      saturation={0}
      fade
      speed={0.4}
    />
  )
}
