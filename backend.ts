import { Person } from './types';

/**
 * 這是一個用於與 Google Sheets 後端同步的工具
 * 參考結構: https://docs.google.com/spreadsheets/d/15tjor1Zh6LZUFCWnnvdwrYdPqYnD1j2mM9PhapL5qas/
 */

// 這裡填入您的 Google Apps Script 部署網址
const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyKoTQ73KHoSp3Yx3L_QKWrB7ndQZpUoTZA6Nf9qjKVy-BiwtCqwTXsjQee-f3G80vilQ/exec';

export const fetchCandidatesFromBackend = async (): Promise<Person[]> => {
    try {
        const response = await fetch(GAS_WEBHOOK_URL);
        const data = await response.json();
        return data.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.name,
            department: item.department,
            attended: item.attended === true || item.attended === "TRUE",
            checkInTime: item.checkintime ? new Date(item.checkintime).getTime() : undefined,
            region: item.region
        }));
    } catch (error) {
        console.error('[Backend] 讀取失敗:', error);
        return [];
    }
};

export const syncCheckInToBackend = async (person: Person) => {
    try {
        // 使用 POST 發送到 Google Apps Script
        // 注意：GAS 發送 POST 可能會有轉址問題，但在這裏我們簡單處理
        await fetch(GAS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors', // 重要：避免 CORS 問題，雖然這樣無法讀取 Response 但能發送成功
            body: JSON.stringify({
                action: 'checkIn',
                name: person.name,
                region: person.region
            })
        });
        return { success: true };
    } catch (error) {
        console.error('[Backend] 同步失敗:', error);
        return { success: false, error };
    }
};
export const syncWinnerToBackend = async (person: Person) => {
    try {
        await fetch(GAS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'markWinner',
                name: person.name,
                winTime: new Date().toISOString()
            })
        });
        return { success: true };
    } catch (error) {
        console.error('[Backend] 中獎同步失敗:', error);
        return { success: false, error };
    }
};

export const clearWinnersFromBackend = async () => {
    try {
        await fetch(GAS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'clearWinners'
            })
        });
        return { success: true };
    } catch (error) {
        console.error('[Backend] 清除中獎記錄失敗:', error);
        return { success: false, error };
    }
};

export const saveAllToBackend = async (people: Person[]) => {
    try {
        await fetch(GAS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'saveAll',
                data: people.map(p => ({
                    id: p.id,
                    name: p.name,
                    department: p.department,
                    attended: p.attended ? "TRUE" : "FALSE",
                    region: p.region || ""
                }))
            })
        });
        return true;
    } catch (error) {
        console.error('[Backend] 全域儲存失敗:', error);
        return false;
    }
};
