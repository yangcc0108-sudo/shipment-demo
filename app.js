let productData = null;
let pendingList = [];
let html5QrCode = null;

// QRスキャン成功時
function onScanSuccess(decodedText) {
  // 仮の商品情報
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

// ボタンクリックでカメラ起動
document.getElementById("startScanBtn").addEventListener("click", () => {
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      let cameraId = cameras[cameras.length - 1]; // 背面カメラ
      html5QrCode = new Html5Qrcode("reader");
      html5QrCode.start(
        cameraId.id,
        { fps: 10, qrbox: 200 },
        decodedText => onScanSuccess(decodedText)
      );
    } else {
      alert("カメラが見つかりません");
    }
  }).catch(err => alert("カメラアクセスに失敗しました: " + err));
});

// フォーム送信処理
document.getElementById("shipmentForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!productData) {
    alert("先にIDスキャンしてください");
    return;
  }

  const form = e.target;
  const expiry = form.expiry_date.value;
  const photoFile = form.photo.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    pendingList.push({ ...productData, expiry_date: expiry, photo_url: reader.result });
    renderList();
  };
  reader.readAsDataURL(photoFile);
  form.reset();
});

// 確認待ちリスト描画
function renderList() {
  document.getElementById("list").innerHTML = pendingList.map(item => `
    <div class="item">
      <b>${item.product_name}</b> / ${item.destination} / 賞味: ${item.expiry_date}<br>
      <img src="${item.photo_url}">
    </div>
  `).join("");
}
