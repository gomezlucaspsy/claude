using UnityEngine;

namespace PersonaForge.UI
{
    /// <summary>
    /// Typing indicator with 3 animated dots. Attach to the TypingIndicator prefab.
    /// </summary>
    public class TypingIndicator : MonoBehaviour
    {
        [SerializeField] private RectTransform[] dots;
        [SerializeField] private Color dotColor = new(0.4f, 0.7f, 1f, 1f);
        [SerializeField] private float pulseSpeed = 1.2f;
        [SerializeField] private float minScale = 0.6f;
        [SerializeField] private float maxScale = 1.0f;
        [SerializeField] private float minAlpha = 0.3f;

        private UnityEngine.UI.Image[] _dotImages;
        private float _staggerDelay = 0.2f;

        private void Start()
        {
            // Auto-find dots if not assigned
            if (dots == null || dots.Length == 0)
            {
                dots = new RectTransform[transform.childCount];
                for (int i = 0; i < transform.childCount; i++)
                    dots[i] = transform.GetChild(i) as RectTransform;
            }

            _dotImages = new UnityEngine.UI.Image[dots.Length];
            for (int i = 0; i < dots.Length; i++)
            {
                _dotImages[i] = dots[i].GetComponent<UnityEngine.UI.Image>();
                if (_dotImages[i] != null)
                    _dotImages[i].color = dotColor;
            }
        }

        private void Update()
        {
            float t = Time.time;

            for (int i = 0; i < dots.Length; i++)
            {
                float phase = Mathf.Sin((t * pulseSpeed - i * _staggerDelay) * Mathf.PI * 2f);
                float normalized = (phase + 1f) * 0.5f; // 0 to 1

                float scale = Mathf.Lerp(minScale, maxScale, normalized);
                dots[i].localScale = Vector3.one * scale;

                if (_dotImages[i] != null)
                {
                    Color c = dotColor;
                    c.a = Mathf.Lerp(minAlpha, 1f, normalized);
                    _dotImages[i].color = c;
                }
            }
        }
    }
}
