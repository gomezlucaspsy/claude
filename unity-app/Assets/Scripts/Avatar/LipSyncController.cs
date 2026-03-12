using UnityEngine;

namespace PersonaForge.Avatar
{
    /// <summary>
    /// Text-driven lip sync system. Analyzes streaming text tokens to drive mouth blend shapes.
    /// For production quality, integrate with an audio-based viseme system (Oculus LipSync, SALSA, etc.)
    /// </summary>
    [RequireComponent(typeof(AvatarController))]
    public class LipSyncController : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private float phonemeDuration = 0.08f;
        [SerializeField] private float closedMouthLerp = 12f;
        [SerializeField] private float openMouthLerp = 18f;
        [SerializeField] private float maxMouthOpen = 0.85f;
        [SerializeField] private float minMouthOpen = 0.1f;

        private AvatarController _avatar;
        private float _targetMouth;
        private float _currentMouth;
        private float _phonemeTimer;
        private bool _isSpeaking;

        // Vowels and consonants mapped to mouth openness
        private static readonly string Vowels = "aeiouAEIOU";
        private static readonly string WideConsonants = "mnbpMNBP";
        private static readonly string OpenConsonants = "dtkgDTKG";

        private string _pendingText = "";
        private int _charIndex;

        private void Awake()
        {
            _avatar = GetComponent<AvatarController>();
        }

        private void Update()
        {
            if (_isSpeaking)
            {
                _phonemeTimer -= Time.deltaTime;
                if (_phonemeTimer <= 0 && _charIndex < _pendingText.Length)
                {
                    char c = _pendingText[_charIndex];
                    _targetMouth = GetMouthOpenness(c);
                    _phonemeTimer = phonemeDuration;
                    _charIndex++;

                    if (_charIndex >= _pendingText.Length)
                    {
                        _pendingText = "";
                        _charIndex = 0;
                    }
                }
            }

            // Smooth interpolation
            float lerpSpeed = _targetMouth > _currentMouth ? openMouthLerp : closedMouthLerp;
            _currentMouth = Mathf.Lerp(_currentMouth, _targetMouth,
                1f - Mathf.Exp(-lerpSpeed * Time.deltaTime));

            _avatar.SetMouthOpen(_currentMouth);
        }

        /// <summary>
        /// Call this each time a streaming text token arrives.
        /// </summary>
        public void FeedToken(string token)
        {
            if (string.IsNullOrEmpty(token)) return;
            _isSpeaking = true;
            _pendingText += token;
        }

        /// <summary>
        /// Call when streaming ends to smoothly close the mouth.
        /// </summary>
        public void StopSpeaking()
        {
            _isSpeaking = false;
            _pendingText = "";
            _charIndex = 0;
            _targetMouth = 0;
        }

        private float GetMouthOpenness(char c)
        {
            if (c == ' ' || c == '\n' || c == '\r')
                return Random.Range(0f, minMouthOpen);

            if (char.IsPunctuation(c))
                return 0f; // brief pause

            if (Vowels.Contains(c.ToString()))
            {
                // Different vowels = different openness
                return c switch
                {
                    'a' or 'A' => maxMouthOpen,
                    'o' or 'O' => maxMouthOpen * 0.8f,
                    'e' or 'E' => maxMouthOpen * 0.6f,
                    'i' or 'I' => maxMouthOpen * 0.4f,
                    'u' or 'U' => maxMouthOpen * 0.5f,
                    _ => maxMouthOpen * 0.5f
                };
            }

            if (WideConsonants.Contains(c.ToString()))
                return minMouthOpen * 1.2f;

            if (OpenConsonants.Contains(c.ToString()))
                return maxMouthOpen * 0.45f;

            // Other consonants
            return Random.Range(minMouthOpen, maxMouthOpen * 0.35f);
        }
    }
}
