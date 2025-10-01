let productData = null;
let pendingList = [];
let html5QrCode = null; // Html5Qrcodeインスタンスを保持

// DOMが完全に読み込まれた後に処理を開始
document.addEventListener('DOMContentLoaded', () => {

    // Html5Qrcodeインスタンスをグローバルに作成し、ID "reader"と紐づける
    html5QrCode = new Html5Qrcode("reader");

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
            <p><strong>スキャン成功 ✅ ID: ${decodedText}</strong></p>
            <b>出荷先:</b> ${productData.destination}<br>
            <b>品名:</b> ${productData.product_name}<br>
            <b>個数:</b> ${productData.quantity}<br>
            <b>備考:</b> ${productData.remarks}<br>
        `;
        
        // スキャンが成功したら、カメラを停止
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                // カメラ停止成功
                document.getElementById("startScanBtn").textContent = "📷 カメラを開く";
            }).catch(err => {
                console.error("カメラの停止に失敗しました: ", err);
            });
        }
    }

    // ボタンクリックでカメラ起動/停止
    document.getElementById("startScanBtn").addEventListener("click", () => {
        if (html5QrCode.isScanning) {
            // 既にスキャン中の場合は停止
            html5QrCode.stop().then(() => {
                document.getElementById("startScanBtn").textContent = "📷 カメラを開く";
            }).catch(err => alert("カメラの停止に失敗しました: " + err));
            return;
        }

        // カメラが見つかったら起動
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                // 通常は背面カメラ（最後に見つかったカメラ）を使用
                let cameraId = cameras[cameras.length - 1].id; 
                
                // カメラ起動処理
                html5QrCode.start(
                    cameraId,
                    { fps: 10, qrbox: 200 },
                    (decodedText, result) => onScanSuccess(decodedText, result),
                    (errorMessage) => {
                        // エラーハンドラは必須ではないが、デバッグに役立つ
                        // console.log("QRスキャンエラー: ", errorMessage);
                    }
                ).then(() => {
                    document.getElementById("startScanBtn").textContent = "❌ カメラを閉じる";
                }).catch(err => {
                    // カメラアクセス許可の拒否など
                    alert("カメラの起動に失敗しました: ブラウザの許可設定を確認してください。エラー: " + err);
                });

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

        // ファイルが選択されているかチェック
        if (!photoFile) {
            alert("写真を選択してください");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            // スキャンされたproductDataとフォームデータを結合してリストに追加
            pendingList.push({ 
                ...productData, 
                expiry_date: expiry, 
                photo_url: reader.result 
            });
            renderList();
            
            // フォームとスキャンデータをリセット
            form.reset();
            productData = null; // 次のスキャンに備えてリセット
            document.getElementById("product").innerHTML = ""; // 表示をクリア
        };
        reader.readAsDataURL(photoFile);
    });

    // 確認待ちリスト描画
    function renderList() {
        document.getElementById("list").innerHTML = pendingList.map(item => `
            <div class="item" style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-bottom: 5px;">
                <b>${item.product_name}</b> / ${item.destination} / 賞味: ${item.expiry_date}<br>
                <img src="${item.photo_url}">
            </div>
        `).join("");
    }
});
