import { create } from 'zustand';

interface StoreState {
  repositories: any[];
  selectedRepo: any | null;
  functions: any[];
  selectedFunc: any | null;
  dependencies: any[];
  optimization: any | null;
  modernization: any | null;
  metrics: {
    total_calls: number;
    avg_compression_ratio: number;
    avg_latency_ms: number;
    total_tokens_saved: number;
  };
  loading: boolean;
  selectedModel: string;
  compressionRate: string;
  
  // Actions
  setRepositories: (repos: any[]) => void;
  setSelectedRepo: (repo: any) => void;
  setFunctions: (funcs: any[]) => void;
  setSelectedFunc: (func: any) => void;
  setDependencies: (deps: any[]) => void;
  setOptimization: (opt: any) => void;
  setModernization: (mod: any) => void;
  setMetrics: (metrics: any) => void;
  setLoading: (status: boolean) => void;
  setSelectedModel: (model: string) => void;
  setCompressionRate: (rate: string) => void;
  resetFunctionState: () => void;
}

export const useStore = create<StoreState>((set) => ({
  repositories: [],
  selectedRepo: null,
  functions: [],
  selectedFunc: null,
  dependencies: [],
  optimization: null,
  modernization: null,
  metrics: {
    total_calls: 0,
    avg_compression_ratio: 0,
    avg_latency_ms: 0,
    total_tokens_saved: 0
  },
  loading: false,
  selectedModel: 'gemini-2.5-flash',
  compressionRate: 'auto',

  setRepositories: (repos) => set({ repositories: repos }),
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  setFunctions: (funcs) => set({ functions: funcs }),
  setSelectedFunc: (func) => set({ selectedFunc: func }),
  setDependencies: (deps) => set({ dependencies: deps }),
  setOptimization: (opt) => set({ optimization: opt }),
  setModernization: (mod) => set({ modernization: mod }),
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (status) => set({ loading: status }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setCompressionRate: (rate) => set({ compressionRate: rate }),
  resetFunctionState: () => set({ 
    selectedFunc: null, 
    optimization: null, 
    modernization: null, 
    dependencies: [] 
  }),
}));
