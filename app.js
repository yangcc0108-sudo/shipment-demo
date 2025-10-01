let productData = null;
let pendingList = [];
let html5QrCode = null;

// QRスキャン成功時
function onScanSuccess(decodedText) {
  productData = {
    id: decodedText,
    destination: "東京倉庫",
    product_name: "りんご",
    quantity: 10,
    remarks: "冷蔵"
  };
  document.getElementById("product").innerHTML = `
    <b>出荷先:</b> ${productData.destination}<br>
    <b>品名:</b> ${productData.product_name}<br>
    <b>個数:</b> ${productData.quantity}<br>
    <b>備考:</b> ${productData.remarks}<br>
  `;
}

// カメラ起動ボタン
document.getElementById("startScanBtn").addEventListener("click", async () => {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) {
      alert("カメラが見つかりません");
      return;
    }
    const cameraId = cameras[cameras.length - 1]; // 背面カメラ
    html5QrCode = new Html5Qrcode("reader");
    await html5QrCode.start(
      cameraId.id,
      { fps: 10, qrbox: 250 },
      decodedText => onScanSuccess(decodedText)
    );
  } catch (err) {
    alert("カメラ起動に失敗しました: " + err);
  }
});

// フォーム送信
document.getElementById("shipmentForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!productData) {
    alert("先にIDスキャンしてください"
