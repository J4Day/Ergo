class Inventory {
    constructor() {
        this.items = [];
        this.maxItems = 6;
        this.visible = false;
    }

    add(item) {
        if (this.items.length >= this.maxItems) return false;
        if (this.has(item.id)) return false;
        this.items.push(item);
        return true;
    }

    remove(itemId) {
        this.items = this.items.filter(i => i.id !== itemId);
    }

    has(itemId) {
        return this.items.some(i => i.id === itemId);
    }

    get(itemId) {
        return this.items.find(i => i.id === itemId);
    }

    clear() {
        this.items = [];
    }

    toggle() {
        this.visible = !this.visible;
    }

    draw(ctx) {
        if (!this.visible) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const boxW = 100;
        const boxH = 16 + this.items.length * 12;
        const boxX = w - boxW - 4;
        const boxY = 4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

        ctx.fillStyle = '#aaa';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Предметы:', boxX + 4, boxY + 4);

        this.items.forEach((item, i) => {
            ctx.fillStyle = '#fff';
            ctx.fillText(item.name, boxX + 8, boxY + 16 + i * 12);
        });

        if (this.items.length === 0) {
            ctx.fillStyle = '#666';
            ctx.fillText('(пусто)', boxX + 8, boxY + 16);
        }
    }
}

const ITEMS = {
    photoFragment1: { id: 'photoFragment1', name: 'Фрагмент фото 1' },
    photoFragment2: { id: 'photoFragment2', name: 'Фрагмент фото 2' },
    photoFragment3: { id: 'photoFragment3', name: 'Фрагмент фото 3' },
    flower1: { id: 'flower1', name: 'Семя надежды' },
    flower2: { id: 'flower2', name: 'Семя прощения' },
    flower3: { id: 'flower3', name: 'Семя памяти' },
    flower4: { id: 'flower4', name: 'Семя любви' },
    doctorNote: { id: 'doctorNote', name: 'Записка доктора' },
    childDrawing: { id: 'childDrawing', name: 'Детский рисунок' }
};
