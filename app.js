// グローバル変数
let productData = null; // スキャンした商品データを保持
let pendingList = []; // 確認待ちリストを保持
let html5QrCode = null; // Html5Qrcodeインスタンスを保持

// DOM要素
const startScanBtn = document.getElementById("startScanBtn");
const productInfoDiv = document.getElementById("product-info");
const shipmentForm = document.getElementById("shipmentForm");
const listDiv = document.getElementById("pending-list");
const submitBtn = shipmentForm.querySelector("button[type='submit']");
const scanRequiredMessage = document.getElementById("scan-required-message");

/**
 * デモ用QRコードを生成する
 */
function createDemoQrCode() {
    const canvas = document.getElementById("qrcode");
    // IDは変更せず、そのまま使用
    const qrText = "@taaigsgh-the-decoder"; 
    
    // QRCode.min.jsが読み込まれた後に実行されることを確認
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, qrText, { width: 200, margin: 1 });
    } else {
        console.error("QRCodeライブラリが見つかりません。");
    }
}


/**
 * QRコードスキャン成功時のコールバック関数
 * @param {string} decodedText - スキャンされたテキスト
 */
function onScanSuccess(decodedText) {
    // スキャン成功！カメラを停止する
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            startScanBtn.textContent = "📷 カメラを開く";
        }).catch(err => {
            console.error("カメラの停止に失敗しました: ", err);
        });
    }
    
    // 仮の商品情報を作成（IDはスキャン結果を使用）
    productData = {
        id: decodedText,
        destination: "東京倉庫",
        product_name: "りんご (スキャンID: " + decodedText.substring(0, 10) + "...) ",
        quantity: 10,
        remarks: "冷蔵"
    };
    
    // フォームを有効化し、商品情報を表示
    updateFormState(true);
    productInfoDiv.innerHTML = `
        <p><strong>✅ IDスキャン成功: ${decodedText.substring(0, 20)}...</strong></p>
        <b>出荷先:</b> ${productData.destination}<br>
        <b>品名:</b> ${productData.product_name}<br>
        <b>個数:</b> ${productData.quantity}<br>
        <b>備考:</b> ${productData.remarks}<br>
    `;
}

/**
 * フォームの有効/無効状態を更新する
 * @param {boolean} isEnabled - フォームを有効にするか (true/false)
 */
function updateFormState(isEnabled) {
    submitBtn.disabled = !isEnabled;
    scanRequiredMessage.style.display = isEnabled ? 'none' : 'block';
    
    // 賞味期限と写真の入力も有効/無効を切り替える
    shipmentForm.expiry_date.disabled = !isEnabled;
    shipmentForm.photo.disabled = !isEnabled;
}


/**
 * カメラの起動処理
 */
function startCamera() {
    // カメラ設定
    const config = {
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
    };

    // カメラのリストを取得
    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            // 通常、最後のカメラが背面カメラ
            const cameraId = cameras[cameras.length - 1].id; 
            
            // カメラ起動
            html5QrCode.start(
                cameraId,
                config,
                onScanSuccess,
                // エラーログはコンソールに出力
                (errorMessage) => { /* console.log(errorMessage); */ }
            ).then(() => {
                startScanBtn.textContent = "❌ カメラを閉じる";
            }).catch(err => {
                alert("カメラの起動に失敗しました。ブラウザの許可設定を確認してください。");
                console.error("カメラ起動エラー:", err);
            });

        } else {
            alert("デバイスにカメラが見つかりません。");
        }
    }).catch(err => {
        alert("カメラアクセス中にエラーが発生しました。");
        console.error("カメラリスト取得エラー:", err);
    });
}


/**
 * 確認待ちリストを描画する
 */
function renderList() {
    if (pendingList.length === 0) {
        listDiv.innerHTML = '<p class="empty-message">登録された出荷データはありません。</p>';
        return;
    }
    
    listDiv.innerHTML = pendingList.map(item => `
        <div class="list-item">
            <img src="${item.photo_url}" alt="出荷写真">
            <div class="list-item-info">
                <b>品名: ${item.product_name.split(' (スキャンID:')[0]}</b><br>
                <span>出荷先: ${item.destination}</span><br>
                <span>賞味期限: ${item.expiry_date}</span><br>
                <small>ID: ${item.id.substring(0, 10)}...</small>
            </div>
        </div>
    `).join("");
}

// =================================================================
// イベントリスナーと初期化
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Html5Qrcodeインスタンスの初期化
    // ID "reader"と紐づける
    html5QrCode = new Html5Qrcode("reader");

    // 2. デモ用QRコードの生成
    createDemoQrCode();
    
    // 3. フォームの初期状態を無効化
    updateFormState(false);
    
    // 4. カメラ起動/停止ボタンのイベントリスナー
    startScanBtn.addEventListener("click", () => {
        if (html5QrCode.isScanning) {
            // 既にスキャン中の場合は停止
            html5QrCode.stop().then(() => {
                startScanBtn.textContent = "📷 カメラを開く";
            }).catch(err => console.error("停止処理中にエラー:", err));
        } else {
            // スキャン開始
            startCamera();
        }
    });

    // 5. フォーム送信処理
    shipmentForm.addEventListener("submit", e => {
        e.preventDefault();
        
        if (!productData) {
            alert("エラー: 先にIDスキャンを完了させてください。");
            return;
        }

        const expiry = shipmentForm.expiry_date.value;
        const photoFile = shipmentForm.photo.files[0];

        if (!photoFile) {
            alert("写真を選択してください。");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            // データをリストに追加
            pendingList.push({ 
                ...productData, 
                expiry_date: expiry, 
                photo_url: reader.result 
            });
            renderList();
            
            // フォームとスキャンデータをリセットし、フォームを無効化
            shipmentForm.reset();
            productData = null; 
            productInfoDiv.innerHTML = ""; 
            updateFormState(false);
        };
        // ファイルをData URLとして読み込む
        reader.readAsDataURL(photoFile);
    });

    // 6. リストの初期描画
    renderList();
});
