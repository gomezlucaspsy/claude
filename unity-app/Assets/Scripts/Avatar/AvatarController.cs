using UnityEngine;

namespace PersonaForge.Avatar
{
    /// <summary>
    /// Controls the 3D avatar's idle animations, breathing, blinking, and state-driven behavior.
    /// Attach to the root of your humanoid avatar prefab.
    /// Requires a SkinnedMeshRenderer with blend shapes for facial expressions.
    /// </summary>
    public class AvatarController : MonoBehaviour
    {
        public enum AvatarState { Idle, Thinking, Speaking }

        [Header("References")]
        [SerializeField] private Animator animator;
        [SerializeField] private SkinnedMeshRenderer faceRenderer;
        [SerializeField] private Transform headBone;
        [SerializeField] private Transform eyeLeftBone;
        [SerializeField] private Transform eyeRightBone;

        [Header("Blend Shape Indices")]
        [Tooltip("Set these to match your model's blend shape names")]
        [SerializeField] private int blinkLeftIndex = -1;
        [SerializeField] private int blinkRightIndex = -1;
        [SerializeField] private int mouthOpenIndex = -1;
        [SerializeField] private int smileIndex = -1;
        [SerializeField] private int browUpIndex = -1;
        [SerializeField] private int browDownIndex = -1;
        [SerializeField] private int jawOpenIndex = -1;

        [Header("Idle Animation")]
        [SerializeField] private float breathSpeed = 1.0f;
        [SerializeField] private float breathAmount = 0.005f;
        [SerializeField] private float swaySpeed = 0.25f;
        [SerializeField] private float swayAmount = 0.3f;

        [Header("Blinking")]
        [SerializeField] private float blinkInterval = 4.5f;
        [SerializeField] private float blinkVariance = 1.5f;
        [SerializeField] private float blinkDuration = 0.12f;
        [SerializeField] private float doubleBinkChance = 0.3f;

        [Header("Head Look")]
        [SerializeField] private float headLookSpeed = 2f;
        [SerializeField] private float headLookRange = 8f;
        [SerializeField] private float thinkingHeadTilt = 5f;

        [Header("Eye Micro-movements")]
        [SerializeField] private float saccadeRange = 1.5f;
        [SerializeField] private float saccadeSpeed = 0.7f;

        // State
        public AvatarState CurrentState { get; private set; } = AvatarState.Idle;

        private float _nextBlinkTime;
        private float _blinkTimer;
        private bool _isBlinking;
        private bool _doDoubleBlink;
        private int _blinkCount;

        private float _currentBlink;
        private float _currentMouth;
        private float _currentBrowUp;
        private float _currentSmile;

        private Vector3 _headTargetRotation;
        private Vector3 _headCurrentRotation;
        private Vector3 _eyeTargetOffset;

        private Vector3 _originalPosition;
        private Quaternion _originalHeadRotation;

        // Animator hashes
        private static readonly int AnimState = Animator.StringToHash("State");
        private static readonly int AnimIsTalking = Animator.StringToHash("IsTalking");
        private static readonly int AnimIsThinking = Animator.StringToHash("IsThinking");

        private void Start()
        {
            _originalPosition = transform.localPosition;
            if (headBone != null)
                _originalHeadRotation = headBone.localRotation;

            ScheduleNextBlink();
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

                if (blinkLeftIndex < 0 && (name.Contains("blink_l") || name.Contains("blinkleft") || name.Contains("eye_blink_l")))
                    blinkLeftIndex = i;
                if (blinkRightIndex < 0 && (name.Contains("blink_r") || name.Contains("blinkright") || name.Contains("eye_blink_r")))
                    blinkRightIndex = i;
                if (mouthOpenIndex < 0 && (name.Contains("mouth_open") || name.Contains("mouthopen") || name.Contains("jaw_open")))
                    mouthOpenIndex = i;
                if (jawOpenIndex < 0 && (name.Contains("jawopen") || name.Contains("jaw_open")))
                    jawOpenIndex = i;
                if (smileIndex < 0 && (name.Contains("smile") || name.Contains("mouth_smile")))
                    smileIndex = i;
                if (browUpIndex < 0 && (name.Contains("brow_up") || name.Contains("browup") || name.Contains("browsinnerup")))
                    browUpIndex = i;
                if (browDownIndex < 0 && (name.Contains("brow_down") || name.Contains("browdown")))
                    browDownIndex = i;
            }
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            float t = Time.time;

            UpdateBreathing(t);
            UpdateBodySway(t);
            UpdateBlinking(dt);
            UpdateHeadLook(t, dt);
            UpdateEyeMicro(t, dt);
            UpdateStateExpressions(dt);
            ApplyBlendShapes();
            UpdateAnimator();
        }

        public void SetState(AvatarState state)
        {
            CurrentState = state;
        }

        // === BREATHING ===
        private void UpdateBreathing(float t)
        {
            float breathOffset = Mathf.Sin(t * breathSpeed) * breathAmount;
            var pos = _originalPosition;
            pos.y += breathOffset;
            transform.localPosition = pos;
        }

        // === BODY SWAY ===
        private void UpdateBodySway(float t)
        {
            float swayZ = Mathf.Sin(t * swaySpeed) * swayAmount;
            float swayY = Mathf.Sin(t * swaySpeed * 0.7f) * swayAmount * 0.5f;
            transform.localRotation = Quaternion.Euler(0, swayY, swayZ);
        }

        // === BLINKING ===
        private void UpdateBlinking(float dt)
        {
            if (!_isBlinking)
            {
                _nextBlinkTime -= dt;
                if (_nextBlinkTime <= 0)
                {
                    _isBlinking = true;
                    _blinkTimer = 0;
                    _blinkCount = 0;
                    _doDoubleBlink = Random.value < doubleBinkChance;
                }
            }

            if (_isBlinking)
            {
                _blinkTimer += dt;
                float phase = _blinkTimer / blinkDuration;

                if (phase <= 1f)
                {
                    // Close
                    _currentBlink = Mathf.Sin(phase * Mathf.PI) * 100f;
                }
                else if (_doDoubleBlink && _blinkCount == 0)
                {
                    _blinkCount = 1;
                    _blinkTimer = -0.08f; // small gap before second blink
                    _currentBlink = 0;
                }
                else
                {
                    _isBlinking = false;
                    _currentBlink = 0;
                    ScheduleNextBlink();
                }
            }
        }

        private void ScheduleNextBlink()
        {
            _nextBlinkTime = blinkInterval + Random.Range(-blinkVariance, blinkVariance);
        }

        // === HEAD LOOK ===
        private void UpdateHeadLook(float t, float dt)
        {
            if (headBone == null) return;

            float range = headLookRange;
            float tiltX = 0;

            switch (CurrentState)
            {
                case AvatarState.Thinking:
                    _headTargetRotation.x = -thinkingHeadTilt + Mathf.Sin(t * 0.4f) * 2f;
                    _headTargetRotation.y = Mathf.Sin(t * 0.35f) * range * 0.8f;
                    _headTargetRotation.z = Mathf.Sin(t * 0.28f) * 2f;
                    break;
                case AvatarState.Speaking:
                    _headTargetRotation.x = Mathf.Sin(t * 0.5f) * 3f;
                    _headTargetRotation.y = Mathf.Sin(t * 0.3f) * range * 0.4f;
                    _headTargetRotation.z = Mathf.Sin(t * 0.35f) * 1.5f;
                    break;
                default: // Idle
                    _headTargetRotation.x = Mathf.Sin(t * 0.3f + 0.5f) * range * 0.3f;
                    _headTargetRotation.y = Mathf.Sin(t * 0.22f) * range * 0.4f;
                    _headTargetRotation.z = Mathf.Sin(t * 0.28f) * 1.5f;
                    break;
            }

            _headCurrentRotation = Vector3.Lerp(_headCurrentRotation, _headTargetRotation,
                1f - Mathf.Exp(-headLookSpeed * dt));

            headBone.localRotation = _originalHeadRotation * Quaternion.Euler(_headCurrentRotation);
        }

        // === EYE MICRO-MOVEMENTS ===
        private void UpdateEyeMicro(float t, float dt)
        {
            if (eyeLeftBone == null && eyeRightBone == null) return;

            float ex = Mathf.Sin(t * saccadeSpeed) * saccadeRange +
                       Mathf.Sin(t * saccadeSpeed * 3f) * saccadeRange * 0.3f;
            float ey = Mathf.Cos(t * saccadeSpeed * 0.7f) * saccadeRange * 0.6f;

            _eyeTargetOffset = Vector3.Lerp(_eyeTargetOffset, new Vector3(ex, ey, 0), 1f - Mathf.Exp(-4f * dt));

            if (eyeLeftBone != null)
                eyeLeftBone.localRotation = Quaternion.Euler(_eyeTargetOffset);
            if (eyeRightBone != null)
                eyeRightBone.localRotation = Quaternion.Euler(_eyeTargetOffset);
        }

        // === STATE EXPRESSIONS ===
        private void UpdateStateExpressions(float dt)
        {
            float targetBrow = 0;
            float targetSmile = 0;

            switch (CurrentState)
            {
                case AvatarState.Thinking:
                    targetBrow = 50f;
                    targetSmile = 10f;
                    break;
                case AvatarState.Speaking:
                    targetBrow = 15f;
                    targetSmile = 25f;
                    break;
                default:
                    targetBrow = 0f;
                    targetSmile = 15f;
                    break;
            }

            _currentBrowUp = Mathf.Lerp(_currentBrowUp, targetBrow, 1f - Mathf.Exp(-3f * dt));
            _currentSmile = Mathf.Lerp(_currentSmile, targetSmile, 1f - Mathf.Exp(-3f * dt));
        }

        // === APPLY BLEND SHAPES ===
        private void ApplyBlendShapes()
        {
            if (faceRenderer == null) return;

            SetBlendSafe(blinkLeftIndex, _currentBlink);
            SetBlendSafe(blinkRightIndex, _currentBlink);
            SetBlendSafe(mouthOpenIndex, _currentMouth);
            SetBlendSafe(jawOpenIndex, _currentMouth * 0.6f);
            SetBlendSafe(smileIndex, _currentSmile);
            SetBlendSafe(browUpIndex, _currentBrowUp);
        }

        private void SetBlendSafe(int index, float value)
        {
            if (index >= 0 && index < faceRenderer.sharedMesh.blendShapeCount)
                faceRenderer.SetBlendShapeWeight(index, Mathf.Clamp(value, 0, 100));
        }

        private void UpdateAnimator()
        {
            if (animator == null) return;
            animator.SetInteger(AnimState, (int)CurrentState);
            animator.SetBool(AnimIsTalking, CurrentState == AvatarState.Speaking);
            animator.SetBool(AnimIsThinking, CurrentState == AvatarState.Thinking);
        }

        // === PUBLIC API FOR LIP SYNC ===
        public void SetMouthOpen(float value01)
        {
            _currentMouth = Mathf.Clamp01(value01) * 100f;
        }

        public void SetEmotion(string emotion, float intensity01 = 1f)
        {
            float v = Mathf.Clamp01(intensity01) * 100f;
            switch (emotion.ToLowerInvariant())
            {
                case "smile":
                case "happy":
                    _currentSmile = v;
                    break;
                case "concerned":
                case "thinking":
                    _currentBrowUp = v * 0.6f;
                    break;
            }
        }
    }
}
