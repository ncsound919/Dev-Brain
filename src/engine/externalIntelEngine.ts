import { SectorType } from '../types';

export interface IntelLink {
  id: string;
  title: string;
  url: string;
  source: string;
  type: 'github' | 'forum' | 'research' | 'trending' | 'social';
  description: string;
}

export interface IntelCategory {
  categoryName: string;
  links: IntelLink[];
}

export class ExternalIntelEngine {
  /**
   * Extracts core keywords from a problem context string.
   */
  private static extractKeywords(context: string): string {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 
      'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 
      'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
      'i', 'we', 'you', 'he', 'she', 'it', 'they', 'what', 'which', 'who', 'whom', 'this',
      'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'build', 'create',
      'make', 'design', 'decide', 'optimal', 'best', 'strategy', 'approach', 'system'
    ]);

    const words = context.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
    const meaningfulWords = words.filter(w => w.length > 2 && !stopWords.has(w));
    
    // Take up to 3 keywords to form a solid search query
    return meaningfulWords.slice(0, 3).join(' ') || 'architecture'; 
  }

  /**
   * Generates sector-aware external validation links.
   */
  public static generateLinks(problemContext: string, sector: SectorType | 'all' | 'science_sports'): IntelCategory[] {
    const rawQuery = this.extractKeywords(problemContext);
    const query = encodeURIComponent(rawQuery);
    
    const categories: IntelCategory[] = [];

    // 1. Engineering & Code (Always relevant for a tactical OS)
    categories.push({
      categoryName: 'GitHub Ecosystem',
      links: [
        {
          id: 'gh_awesome',
          title: `Awesome ${rawQuery}`,
          url: `https://github.com/search?q=awesome+${query}&type=repositories`,
          source: 'GitHub',
          type: 'github',
          description: 'Curated lists of the best tools, libraries, and resources.'
        },
        {
          id: 'gh_trending',
          title: 'Top Starred Repositories',
          url: `https://github.com/search?q=${query}&type=repositories&s=stars&o=desc`,
          source: 'GitHub Search',
          type: 'trending',
          description: 'Most starred projects and implementations solving this problem.'
        }
      ]
    });

    // 2. Developer / Tactical Forums
    categories.push({
      categoryName: 'Community Forums & Discussions',
      links: [
        {
          id: 'hn_search',
          title: 'Hacker News Sentiment',
          url: `https://hn.algolia.com/?q=${query}`,
          source: 'Hacker News',
          type: 'forum',
          description: 'Engineering and startup community discussions and critiques.'
        },
        {
          id: 'reddit_search',
          title: 'Reddit Deep Dives',
          url: `https://www.reddit.com/search/?q=${query}`,
          source: 'Reddit',
          type: 'forum',
          description: 'Broad community sentiment, edge cases, and user complaints.'
        }
      ]
    });

    // 3. Sector-Specific Deep Research
    if (sector === 'science_biotech') {
      categories.push({
        categoryName: 'Clinical & Biotech Research',
        links: [
          {
            id: 'pubmed',
            title: 'PubMed Literature',
            url: `https://pubmed.ncbi.nlm.nih.gov/?term=${query}`,
            source: 'NIH',
            type: 'research',
            description: 'Peer-reviewed biomedical literature and clinical trials.'
          },
          {
            id: 'biorxiv',
            title: 'bioRxiv Preprints',
            url: `https://www.biorxiv.org/search/${query}`,
            source: 'bioRxiv',
            type: 'research',
            description: 'The preprint server for biology and life sciences.'
          }
        ]
      });
    } else if (sector === 'financial') {
      categories.push({
        categoryName: 'Quantitative & Economic Research',
        links: [
          {
            id: 'ssrn',
            title: 'SSRN Papers',
            url: `https://papers.ssrn.com/sol3/results.cfm?txtKey_Words=${query}`,
            source: 'SSRN',
            type: 'research',
            description: "Tomorrow's research today in economics and finance."
          },
          {
            id: 'quantstart',
            title: 'Quant Discussions',
            url: `https://www.google.com/search?q=site:nuclearphynance.com+OR+site:quantstart.com+${query}`,
            source: 'Quant Forums',
            type: 'forum',
            description: 'Algorithmic trading and quantitative finance community.'
          }
        ]
      });

      categories.push({
        categoryName: 'Capital Allocation & Value (Buffett/Munger)',
        links: [
          {
            id: 'berkshire_letters',
            title: 'Berkshire Shareholder Letters',
            url: `https://www.google.com/search?q=site:berkshirehathaway.com/letters+${query}`,
            source: 'Berkshire Hathaway',
            type: 'research',
            description: 'Timeless principles on moat analysis, intrinsic value, and capital allocation.'
          },
          {
            id: 'farnam_street_models',
            title: 'Munger\'s Mental Models',
            url: `https://fs.blog/mental-models/`,
            source: 'Farnam Street',
            type: 'social',
            description: 'Multi-disciplinary lattices of mental models for robust financial reasoning.'
          }
        ]
      });

      categories.push({
        categoryName: 'Macro & Risk Mechanics (Ray Dalio / Simons)',
        links: [
          {
            id: 'dalio_principles',
            title: 'Economic Machine',
            url: `https://www.economicprinciples.org/`,
            source: 'Bridgewater',
            type: 'research',
            description: 'Understanding macroeconomic cycles, credit, and deleveraging.'
          },
          {
            id: 'renaissance_tech',
            title: 'Medallion / Jim Simons Theory',
            url: `https://www.google.com/search?q=Jim+Simons+Renaissance+Technologies+${query}`,
            source: 'RenTech Lore',
            type: 'research',
            description: 'Applying pure mathematics and hidden Markov models to market inefficiencies.'
          }
        ]
      });
    } else if (sector === 'business') {
      categories.push({
        categoryName: 'Strategy & Disruption (Christensen / Porter)',
        links: [
          {
            id: 'innovators_dilemma',
            title: 'The Innovator\'s Dilemma',
            url: `https://hbr.org/search?term=clayton+christensen+${query}`,
            source: 'HBR',
            type: 'research',
            description: 'Analyzing asymmetric competition and disruptive technology arcs.'
          },
          {
            id: 'porters_five_forces',
            title: 'Competitive Strategy',
            url: `https://hbr.org/search?term=michael+porter+${query}`,
            source: 'HBR',
            type: 'research',
            description: 'Structural assessment of industry profitability and competitive moats.'
          }
        ]
      });

      categories.push({
        categoryName: 'Zero to One & Moats (Thiel / Hamilton Helmer)',
        links: [
          {
            id: 'seven_powers',
            title: '7 Powers (Strategy)',
            url: `https://www.google.com/search?q=Hamilton+Helmer+7+Powers+${query}`,
            source: 'Helmer',
            type: 'research',
            description: 'Statics (Scale Economies, Network Effects) and Dynamics (Counter-Positioning) of business moats.'
          },
          {
            id: 'thiel_monopoly',
            title: 'Competition is for Losers',
            url: `https://www.google.com/search?q=Peter+Thiel+Monopoly+${query}`,
            source: 'Thiel',
            type: 'forum',
            description: 'Escaping perfect competition and capturing proprietary value.'
          }
        ]
      });
    } else if (sector === 'science_sports') {
      categories.push({
        categoryName: 'Sports Analytics & Tactics',
        links: [
          {
            id: 'twitter_analytics',
            title: 'X/Twitter Analysts',
            url: `https://twitter.com/search?q=${query}+analytics&f=top`,
            source: 'X/Twitter',
            type: 'social',
            description: 'Real-time tactical breakdowns from independent analysts.'
          },
          {
            id: 'arxiv_sports',
            title: 'arXiv Stats/Sports',
            url: `https://arxiv.org/search/?query=${query}+sports&searchtype=all`,
            source: 'arXiv',
            type: 'research',
            description: 'Quantitative papers on sports modeling and strategy.'
          }
        ]
      });
    } else {
      // Default Dev/Systems fallback
      categories.push({
        categoryName: 'Computer Science Research',
        links: [
          {
            id: 'arxiv_cs',
            title: 'arXiv (CS)',
            url: `https://arxiv.org/search/?query=${query}&searchtype=all&source=header`,
            source: 'arXiv',
            type: 'research',
            description: 'Computer science preprints and algorithmic proofs.'
          },
          {
            id: 'stackoverflow',
            title: 'StackOverflow Architectures',
            url: `https://stackoverflow.com/search?q=${query}+is%3Aquestion+views%3A1000`,
            source: 'StackOverflow',
            type: 'forum',
            description: 'High-visibility technical questions and architectural answers.'
          }
        ]
      });

      categories.push({
        categoryName: 'Software 2.0 & AI Dev (Karpathy)',
        links: [
          {
            id: 'karpathy_recipe',
            title: 'A Recipe for Training Neural Networks',
            url: 'https://karpathy.github.io/2019/04/25/recipe/',
            source: 'Karpathy Blog',
            type: 'research',
            description: 'The canonical guide to deep learning debugging and training loops.'
          },
          {
            id: 'karpathy_llm_os',
            title: 'The LLM OS Architecture',
            url: 'https://twitter.com/karpathy/status/1723140225430835463',
            source: 'X/Twitter',
            type: 'social',
            description: 'Conceptual architecture for treating LLMs as the core kernel of a new OS.'
          },
          {
            id: 'karpathy_nn_zero_to_hero',
            title: 'Neural Networks: Zero to Hero',
            url: 'https://karpathy.ai/zero-to-hero.html',
            source: 'Karpathy AI',
            type: 'research',
            description: 'Building deep learning models from the ground up, starting from micrograd.'
          }
        ]
      });

      categories.push({
        categoryName: 'Planet-Scale Systems (Jeff Dean)',
        links: [
          {
            id: 'jeff_dean_latency',
            title: 'Latency Numbers Every Programmer Should Know',
            url: 'https://gist.github.com/jboner/2841832',
            source: 'Gist / Dean Talks',
            type: 'github',
            description: 'Fundamental physics of system latency, from L1 cache to network packets.'
          },
          {
            id: 'jeff_dean_tail_latency',
            title: 'The Tail at Scale',
            url: 'https://cacm.acm.org/magazines/2013/2/160173-the-tail-at-scale/fulltext',
            source: 'CACM',
            type: 'research',
            description: 'Seminal paper on achieving rapid response times in large, distributed systems.'
          }
        ]
      });

      categories.push({
        categoryName: 'Pragmatic AI (Jeremy Howard)',
        links: [
          {
            id: 'fastai_course',
            title: 'Practical Deep Learning for Coders',
            url: 'https://course.fast.ai/',
            source: 'Fast.ai',
            type: 'research',
            description: 'Top-down, code-first approach to solving real AI problems quickly.'
          },
          {
            id: 'jeremy_howard_nlp',
            title: 'ULMFiT & Transfer Learning',
            url: 'https://arxiv.org/abs/1801.06146',
            source: 'arXiv',
            type: 'research',
            description: 'The breakthrough that enabled pre-trained transfer learning before the LLM boom.'
          }
        ]
      });

      categories.push({
        categoryName: 'Mechanistic Interpretability (Chris Olah)',
        links: [
          {
            id: 'olah_distill',
            title: 'Distill.pub Essays',
            url: 'https://distill.pub/',
            source: 'Distill',
            type: 'research',
            description: 'Pioneering visual explanations of machine learning models and attention mechanics.'
          },
          {
            id: 'anthropic_circuits',
            title: 'Transformer Circuits Thread',
            url: 'https://transformer-circuits.pub/',
            source: 'Anthropic',
            type: 'research',
            description: 'Reverse-engineering LLMs to understand their internal reasoning structures.'
          }
        ]
      });
    }

    return categories;
  }
}
