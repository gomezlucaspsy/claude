using UnityEngine;

namespace PersonaForge.Avatar
{
    /// <summary>
    /// Manages facial expression states through blend shapes.
    /// Drives emotions via smooth interpolation between expression presets.
    /// </summary>
    [RequireComponent(typeof(AvatarController))]
    public class ExpressionController : MonoBehaviour
    {
        [System.Serializable]
        public class Expression
        {
            public string name;
            [Range(0, 100)] public float smile;
            [Range(0, 100)] public float browUp;
            [Range(0, 100)] public float browDown;
            [Range(0, 100)] public float mouthOpen;
            [Range(0, 100)] public float squint;
        }

        [Header("Blend Shape Indices")]
        [SerializeField] private SkinnedMeshRenderer faceRenderer;
        [SerializeField] private int squintLeftIndex = -1;
        [SerializeField] private int squintRightIndex = -1;
        [SerializeField] private int frownIndex = -1;
        [SerializeField] private int surpriseIndex = -1;

        [Header("Expression Presets")]
        [SerializeField] private Expression[] presets = new Expression[]
        {
            new() { name = "neutral", smile = 10, browUp = 0, browDown = 0, mouthOpen = 0, squint = 0 },
            new() { name = "happy", smile = 70, browUp = 15, browDown = 0, mouthOpen = 10, squint = 20 },
            new() { name = "thinking", smile = 5, browUp = 45, browDown = 0, mouthOpen = 0, squint = 10 },
            new() { name = "concerned", smile = 0, browUp = 30, browDown = 20, mouthOpen = 5, squint = 0 },
            new() { name = "surprised", smile = 20, browUp = 60, browDown = 0, mouthOpen = 30, squint = 0 },
            new() { name = "empathetic", smile = 25, browUp = 20, browDown = 5, mouthOpen = 0, squint = 15 },
        };

        [Header("Transition")]
        [SerializeField] private float transitionSpeed = 3f;

        private Expression _currentTarget;
        private float _currentSmile, _currentBrowUp, _currentBrowDown, _currentSquint, _currentMouth;

        private AvatarController _avatar;

        private void Awake()
        {
            _avatar = GetComponent<AvatarController>();
            _currentTarget = presets[0]; // neutral
        }

        private void Start()
        {
            AutoDetectBlendShapes();
        }

        private void AutoDetectBlendShapes()
        {
            if (faceRenderer == null) return;
            var mesh = faceRenderer.sharedMesh;
            if (mesh == null) return;

            for (int i = 0; i < mesh.blendShapeCount; i++)
            {
                string name = mesh.GetBlendShapeName(i).ToLowerInvariant();
                if (squintLeftIndex < 0 && (name.Contains("squint_l") || name.Contains("eye_squint_l")))
                    squintLeftIndex = i;
                if (squintRightIndex < 0 && (name.Contains("squint_r") || name.Contains("eye_squint_r")))
                    squintRightIndex = i;
                if (frownIndex < 0 && name.Contains("frown"))
                    frownIndex = i;
                if (surpriseIndex < 0 && (name.Contains("surprise") || name.Contains("jaw_open")))
                    surpriseIndex = i;
            }
        }

        private void Update()
        {
            if (_currentTarget == null) return;
            float dt = Time.deltaTime;
            float t = 1f - Mathf.Exp(-transitionSpeed * dt);

            _currentSmile = Mathf.Lerp(_currentSmile, _currentTarget.smile, t);
            _currentBrowUp = Mathf.Lerp(_currentBrowUp, _currentTarget.browUp, t);
            _currentBrowDown = Mathf.Lerp(_currentBrowDown, _currentTarget.browDown, t);
            _currentSquint = Mathf.Lerp(_currentSquint, _currentTarget.squint, t);

            // Apply additional blend shapes not handled by AvatarController
            if (faceRenderer != null)
            {
                SetBlendSafe(squintLeftIndex, _currentSquint);
                SetBlendSafe(squintRightIndex, _currentSquint);
                SetBlendSafe(frownIndex, _currentBrowDown);
            }
        }

        /// <summary>
        /// Set expression by name (matches presets).
        /// </summary>
        public void SetExpression(string expressionName)
        {
            foreach (var preset in presets)
            {
                if (preset.name.Equals(expressionName, System.StringComparison.OrdinalIgnoreCase))
                {
                    _currentTarget = preset;
                    _avatar.SetEmotion(expressionName);
                    return;
                }
            }
            Debug.LogWarning($"Expression '{expressionName}' not found, using neutral.");
            _currentTarget = presets[0];
        }

        /// <summary>
        /// Detect emotion from response text using simple keyword analysis.
        /// Call this with the complete AI response.
        /// </summary>
        public void DetectEmotionFromText(string text)
        {
            string lower = text.ToLowerInvariant();

            if (ContainsAny(lower, "haha", "lol", "😄", "😊", "funny", "laugh", "joy"))
                SetExpression("happy");
            else if (ContainsAny(lower, "sorry", "sad", "understand", "tough", "hard time", "here for you"))
                SetExpression("empathetic");
            else if (ContainsAny(lower, "hmm", "interesting", "wonder", "consider", "think about", "curious"))
                SetExpression("thinking");
            else if (ContainsAny(lower, "worry", "concern", "careful", "be aware"))
                SetExpression("concerned");
            else if (ContainsAny(lower, "wow", "amazing", "incredible", "really", "no way", "!"))
                SetExpression("surprised");
            else
                SetExpression("neutral");
        }

        private static bool ContainsAny(string text, params string[] keywords)
        {
            foreach (var kw in keywords)
                if (text.Contains(kw)) return true;
            return false;
        }

        private void SetBlendSafe(int index, float value)
        {
            if (index >= 0 && faceRenderer != null && index < faceRenderer.sharedMesh.blendShapeCount)
                faceRenderer.SetBlendShapeWeight(index, Mathf.Clamp(value, 0, 100));
        }
    }
}
