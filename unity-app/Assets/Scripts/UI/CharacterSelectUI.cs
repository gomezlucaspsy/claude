using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace PersonaForge.UI
{
    /// <summary>
    /// Character selection screen. Displays character cards in a grid.
    /// Fires OnCharacterSelected when a card is clicked.
    /// </summary>
    public class CharacterSelectUI : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private RectTransform cardContainer;
        [SerializeField] private GameObject characterCardPrefab;

        [Header("Character Data")]
        [SerializeField] private Network.CharacterData[] characters;

        public event System.Action<Network.CharacterData> OnCharacterSelected;

        private void Start()
        {
            PopulateCards();
        }

        private void PopulateCards()
        {
            if (characters == null || characterCardPrefab == null) return;

            foreach (var character in characters)
            {
                var card = Instantiate(characterCardPrefab, cardContainer);
                SetupCard(card, character);
            }
        }

        private void SetupCard(GameObject card, Network.CharacterData character)
        {
            // Find child text elements by name
            var nameText = FindChild<TextMeshProUGUI>(card, "NameText");
            var titleText = FindChild<TextMeshProUGUI>(card, "TitleText");
            var avatarText = FindChild<TextMeshProUGUI>(card, "AvatarText");

            if (nameText != null) nameText.text = character.name;
            if (titleText != null) titleText.text = character.title;
            if (avatarText != null) avatarText.text = character.avatar;

            // Apply accent color
            Color charColor;
            if (ColorUtility.TryParseHtmlString(character.color, out charColor))
            {
                var border = FindChild<Image>(card, "Border");
                if (border != null) border.color = charColor;
                if (titleText != null) titleText.color = charColor;
            }

            // Click handler
            var btn = card.GetComponent<Button>();
            if (btn == null) btn = card.AddComponent<Button>();
            btn.onClick.AddListener(() => OnCharacterSelected?.Invoke(character));
        }

        private T FindChild<T>(GameObject parent, string childName) where T : Component
        {
            var transforms = parent.GetComponentsInChildren<Transform>(true);
            foreach (var t in transforms)
            {
                if (t.name == childName)
                    return t.GetComponent<T>();
            }
            return null;
        }
    }
}
