using UnityEngine;
using UnityEngine.Rendering;

namespace PersonaForge.Scene
{
    /// <summary>
    /// Sets up a Replika-style camera and studio lighting rig.
    /// Attach to the Main Camera or an empty GameObject in the scene.
    /// </summary>
    public class StudioSetup : MonoBehaviour
    {
        [Header("Camera")]
        [SerializeField] private Camera mainCamera;
        [SerializeField] private Transform cameraTarget; // avatar head
        [SerializeField] private float cameraFOV = 30f;
        [SerializeField] private Vector3 cameraOffset = new(0f, 0.15f, 2.2f);
        [SerializeField] private float cameraFollowSpeed = 2f;

        [Header("Camera Idle Motion")]
        [SerializeField] private float idleSwayAmount = 0.02f;
        [SerializeField] private float idleSwaySpeed = 0.3f;

        [Header("Background")]
        [SerializeField] private Color bgColor = new(0.02f, 0.05f, 0.1f, 1f);
        [SerializeField] private Material backgroundMaterial;

        [Header("Lights - Auto Create")]
        [SerializeField] private bool autoCreateLights = true;

        private Vector3 _cameraBasePos;

        private void Start()
        {
            if (mainCamera == null)
                mainCamera = Camera.main;

            if (mainCamera != null)
            {
                mainCamera.fieldOfView = cameraFOV;
                mainCamera.backgroundColor = bgColor;
                mainCamera.clearFlags = CameraClearFlags.SolidColor;
                _cameraBasePos = cameraOffset;
            }

            if (autoCreateLights)
                CreateStudioLighting();
        }

        private void LateUpdate()
        {
            if (mainCamera == null) return;

            float t = Time.time;

            // Subtle camera sway
            Vector3 sway = new Vector3(
                Mathf.Sin(t * idleSwaySpeed) * idleSwayAmount,
                Mathf.Sin(t * idleSwaySpeed * 0.7f) * idleSwayAmount * 0.5f,
                0
            );

            Vector3 targetPos = _cameraBasePos + sway;

            if (cameraTarget != null)
            {
                targetPos += cameraTarget.position;
                mainCamera.transform.position = Vector3.Lerp(
                    mainCamera.transform.position, targetPos,
                    1f - Mathf.Exp(-cameraFollowSpeed * Time.deltaTime));

                // Subtle look-at with offset
                Vector3 lookTarget = cameraTarget.position + Vector3.up * 0.1f;
                Quaternion targetRot = Quaternion.LookRotation(lookTarget - mainCamera.transform.position);
                mainCamera.transform.rotation = Quaternion.Slerp(
                    mainCamera.transform.rotation, targetRot,
                    1f - Mathf.Exp(-cameraFollowSpeed * Time.deltaTime));
            }
            else
            {
                mainCamera.transform.position = targetPos;
            }
        }

        private void CreateStudioLighting()
        {
            // Key light - warm, upper right
            CreateLight("Key Light", LightType.Directional,
                new Vector3(35, -30, 0), new Color(1f, 0.96f, 0.91f), 1.2f);

            // Fill light - cool, from left
            CreateLight("Fill Light", LightType.Directional,
                new Vector3(25, 150, 0), new Color(0.78f, 0.85f, 0.97f), 0.5f);

            // Rim light - back, for edge definition
            CreateLight("Rim Light", LightType.Directional,
                new Vector3(20, 180, 0), new Color(0.63f, 0.72f, 0.88f), 0.8f);

            // Under fill - softens jaw shadows
            var underLight = CreateLight("Under Fill", LightType.Point,
                Vector3.zero, new Color(0.91f, 0.82f, 0.78f), 0.3f);
            underLight.transform.position = new Vector3(0, -0.5f, 1.5f);
            underLight.GetComponent<Light>().range = 5f;

            // Accent colored light (will be set by AppManager)
            var accentLight = CreateLight("Accent Light", LightType.Point,
                Vector3.zero, Color.cyan, 0.3f);
            accentLight.transform.position = new Vector3(1f, 0.5f, 1.5f);
            accentLight.GetComponent<Light>().range = 4f;
        }

        private GameObject CreateLight(string name, LightType type, Vector3 rotation, Color color, float intensity)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform);
            var light = go.AddComponent<Light>();
            light.type = type;
            light.color = color;
            light.intensity = intensity;
            light.shadows = type == LightType.Directional ? LightShadows.Soft : LightShadows.None;

            if (type == LightType.Directional)
                go.transform.rotation = Quaternion.Euler(rotation);

            return go;
        }

        /// <summary>
        /// Set the accent light color to match the character theme.
        /// </summary>
        public void SetAccentColor(Color color)
        {
            var accent = transform.Find("Accent Light");
            if (accent != null)
            {
                var light = accent.GetComponent<Light>();
                if (light != null)
                    light.color = color;
            }
        }
    }
}
