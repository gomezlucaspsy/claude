using UnityEngine;

namespace PersonaForge.Scene
{
    /// <summary>
    /// Floating ambient particles around the avatar. Replika-style soft particle effect.
    /// </summary>
    public class AmbientParticles : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private int particleCount = 20;
        [SerializeField] private Color particleColor = new(0.4f, 0.7f, 1f, 0.4f);
        [SerializeField] private float spawnRadius = 2.5f;
        [SerializeField] private float spawnHeight = 3f;
        [SerializeField] private float riseSpeed = 0.02f;
        [SerializeField] private float driftAmount = 0.002f;
        [SerializeField] private float particleSize = 0.03f;

        private ParticleSystem _ps;

        private void Start()
        {
            CreateParticleSystem();
        }

        private void CreateParticleSystem()
        {
            var go = new GameObject("Particles");
            go.transform.SetParent(transform);
            go.transform.localPosition = Vector3.zero;

            _ps = go.AddComponent<ParticleSystem>();

            var main = _ps.main;
            main.maxParticles = particleCount;
            main.startLifetime = 15f;
            main.startSpeed = 0f;
            main.startSize = particleSize;
            main.startColor = particleColor;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.loop = true;
            main.playOnAwake = true;

            var emission = _ps.emission;
            emission.rateOverTime = particleCount / 5f;

            var shape = _ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(spawnRadius, spawnHeight, spawnRadius * 0.6f);

            var vel = _ps.velocityOverLifetime;
            vel.enabled = true;
            vel.y = new ParticleSystem.MinMaxCurve(riseSpeed * 0.5f, riseSpeed);
            vel.x = new ParticleSystem.MinMaxCurve(-driftAmount, driftAmount);
            vel.z = new ParticleSystem.MinMaxCurve(-driftAmount, driftAmount);

            var col = _ps.colorOverLifetime;
            col.enabled = true;
            var gradient = new Gradient();
            gradient.SetKeys(
                new[] {
                    new GradientColorKey(particleColor, 0f),
                    new GradientColorKey(particleColor, 0.5f),
                    new GradientColorKey(particleColor, 1f)
                },
                new[] {
                    new GradientAlphaKey(0f, 0f),
                    new GradientAlphaKey(particleColor.a, 0.2f),
                    new GradientAlphaKey(particleColor.a, 0.8f),
                    new GradientAlphaKey(0f, 1f)
                }
            );
            col.color = gradient;

            var renderer = go.GetComponent<ParticleSystemRenderer>();
            renderer.renderMode = ParticleSystemRenderMode.Billboard;
            renderer.material = new Material(Shader.Find("Particles/Standard Unlit"))
            {
                color = particleColor
            };
            renderer.material.SetFloat("_Mode", 1); // Additive
        }

        public void SetColor(Color color)
        {
            particleColor = color;
            if (_ps != null)
            {
                var main = _ps.main;
                main.startColor = color;
            }
        }
    }
}
