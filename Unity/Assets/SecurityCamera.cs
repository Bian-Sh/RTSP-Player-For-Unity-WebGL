using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class SecurityCamera : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
{
    [DllImport("__Internal")]
    private static extern void Play(string uuid);

    public Text tips;
    public string uuid;

    GameObject tips_go;
    void Start()
    {
        tips_go = tips.transform.parent.gameObject;
        tips_go.SetActive(false);
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        Debug.Log($"{nameof(SecurityCamera)}: 用户开启监控：{uuid}");
#if !UNITY_EDITOR //不支持编辑器下调用
        Play(uuid);
#endif
    }

    void IPointerEnterHandler.OnPointerEnter(PointerEventData eventData)
    {
        tips.text = $"ID : {uuid}";
        tips_go.SetActive(true);
    }

    void IPointerExitHandler.OnPointerExit(PointerEventData eventData)
    {
        tips_go.SetActive(false);
    }

    void Update()
    {
        if (tips_go.activeInHierarchy)
        {
            tips_go.transform.position = Input.mousePosition;
        }
    }
}
