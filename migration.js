// migration.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase konfiqurasiyası
const firebaseConfig = {
    // Firebase Console-dan götürdüyünüz konfiqurasiya
    apiKey: "AIzaSyDy_z5TxiI0CxoaEnwvGQfM-KhYmaGb1RQ",
    authDomain: "gustopizza-75df6.firebaseapp.com",
    projectId: "gustopizza-75df6",
    storageBucket: "gustopizza-75df6.firebasestorage.app",
    messagingSenderId: "79957512960",
    appId: "1:79957512960:web:922878a84a9b43d07099e5"
};

// Firebase-i initialize et
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Köhnə sifarişlər
const oldOrders = [
    {
        tarix: "1/26/2025 18:24:55",
        musteriId: "CUSTNOT8IOP8Z",
        ad: "Ulvi",
        soyad: "Safarli",
        telefon: "994519707085",
        unvan: "Nizami, Elshan Suleymanov 133",
        sifaris: "Pepperoni x2",
        mebleg: 26.9,
        status: "Hazırlanır"
    },
    // ... digər sifarişlərinizi əlavə edin
];

// Firebase-ə köçürmə funksiyası
async function migrateOrders() {
    const ordersRef = collection(db, 'orders');
    
    for (const order of oldOrders) {
        try {
            const newOrder = {
                customerName: order.ad,
                customerSurname: order.soyad,
                phone: order.telefon,
                address: order.unvan,
                items: parseOrderItems(order.sifaris),
                total: order.mebleg,
                status: order.status,
                customerId: order.musteriId,
                timestamp: new Date(order.tarix),
                note: ""
            };

            const docRef = await addDoc(ordersRef, newOrder);
            console.log(`Sifariş köçürüldü: ${order.musteriId}`);
        } catch (error) {
            console.error(`Xəta: ${order.musteriId}`, error);
        }
    }
}

// Sifariş mətnini parse etmə funksiyası
function parseOrderItems(orderText) {
    const items = [];
    const itemsArray = orderText.split(',');
    
    itemsArray.forEach(item => {
        const [name, quantity] = item.trim().split('x');
        items.push({
            name: name.trim(),
            quantity: parseInt(quantity) || 1,
            price: getPriceForProduct(name.trim())
        });
    });
    
    return items;
}

// Məhsul qiymətləri
function getPriceForProduct(name) {
    const prices = {
        "Pepperoni": 13.45,
        "Margherita": 11.45,
        "Quattro": 15.95,
        "Vegetarian": 13.95,
        "Funghi": 14.95,
        // ... digər məhsullar
    };
    return prices[name] || 0;
}

// Köçürməni başlat
migrateOrders().then(() => {
    console.log("Köçürmə tamamlandı!");
}).catch(error => {
    console.error("Köçürmə xətası:", error);
});