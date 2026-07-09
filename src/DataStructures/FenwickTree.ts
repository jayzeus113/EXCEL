export default class FenwickTree {
    private n: number;
    private arr: number[];

    constructor(n: number) {
        this.n = n;
        this.arr = new Array(n + 1).fill(0);
    }

    public add(idx: number, val: number): void {
        let i: number = idx;
        while (i <= this.n) {
            this.arr[i]! += val;
            i += i & -i;
        }
    }

    public prefixSum(idx: number): number {
        if (idx <= 0) return 0;
        let res: number = 0;
        let i: number = Math.min(idx, this.n);
        while (i > 0) {
            res += this.arr[i] as number;
            i -= i & -i;
        }
        return res;
    }

    public get(l: number, r: number): number {
        if (l > r || l < 1) return 0; 
        return this.prefixSum(r) - this.prefixSum(l - 1);
    }

    public getLen(): number {
        return this.n;
    }


    public getValueAt(i: number): number {
        return this.get(i, i);
    }

    public set(idx: number, val: number): void {
        const delta = val - this.getValueAt(idx);
        this.add(idx, delta);
    }

    public lowerBound(target: number): number {
        if (target < 0) return 0;
        
        let idx = 0;
        let basePower = 1 << Math.floor(Math.log2(this.n));
        
        while (basePower > 0) {
            const nextIdx = idx + basePower;
            if (nextIdx <= this.n && this.arr[nextIdx]! <= target) {
                target -= this.arr[nextIdx]!;
                idx = nextIdx;
            }
            basePower >>= 1; 
        }
        
        return idx;
    }
}
