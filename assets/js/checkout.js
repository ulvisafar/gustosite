import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    increment 
} from 'firebase/firestore';

// Sifariş yaradılanda müştəri məlumatlarını da əlavə edək
async function createOrder(orderData) {
    try {
        // Sifariş yaradılır
        const orderRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            timestamp: serverTimestamp(),
            status: 'Yeni'
        });

        // Müştəri məlumatlarını yoxlayaq/yeniləyək
        const customerId = `CUST${orderData.phone.replace(/[^0-9]/g, '')}`;
        const customerRef = doc(db, 'customers', customerId);
        
        const customerSnapshot = await getDoc(customerRef);
        
        if (customerSnapshot.exists()) {
            // Mövcud müştərini yeniləyək
            await updateDoc(customerRef, {
                name: orderData.customerName,
                surname: orderData.customerSurname,
                phone: orderData.phone,
                lastOrderDate: serverTimestamp(),
                orderCount: increment(1),
                totalAmount: increment(orderData.total)
            });
        } else {
            // Yeni müştəri yaradaq
            await setDoc(customerRef, {
                id: customerId,
                name: orderData.customerName,
                surname: orderData.customerSurname,
                phone: orderData.phone,
                lastOrderDate: serverTimestamp(),
                orderCount: 1,
                totalAmount: orderData.total
            });
        }

        return orderRef;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
} 