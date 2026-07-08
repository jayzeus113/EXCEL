export default class FenwickTree {
    private n: number;
    private arr: number[];

    constructor(n: number) {
        this.n = n;
        this.arr = new Array(n+1).fill(0);
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

    public getValueAt(i: number) {
        return this.get(i, i - 1);
    }

    public set(idx:number, val: number) {
        const delta = val - this.getValueAt(idx);
        for(let i= idx; i<=this.n; i+=i&-i) {
            this.arr[i]! += delta;
        }
    }

    public lowerBound(target: number): number {
        let low = 0;
        let high = this.n;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (target >= (this.prefixSum(mid) as number) && target < (this.prefixSum(mid+1) as number)) {
                return mid;
            } else if (target < (this.prefixSum(mid) as number)) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return -1;
    }
}
