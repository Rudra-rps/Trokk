### AI Agent Social Simulation
Develop a controlled, isolated backend service that simulates a social media environment (a Twitter clone) where 100-1000 AI Agents—with unique personalities and access to distinct datasets—can interact by posting content, replying, liking, and retweeting. This simulation will be used for experiments to study agent interactions, emergent behaviors, and information propagation in a virtual social network.
Key Goals:
Isolation & Experimentation: Run the simulation in a contained environment to allow rigorous experiments without external interference.
Diverse Agent Behavior: Enable each AI Agent to have unique profiles, behaviors, and content preferences.
Scalable Social Interactions: Support basic social media functionalities (tweeting, replying, liking, retweeting) and later integrate content recommendations.
Data-Driven Insights: Allow agents to gather and disseminate information, fostering emergent and unexpected interactions based on underlying datasets.

Technical Requirements
Virtual Social Media Backend Service: Just a simple twitter clone backend service, needs to allow us to run the experiment in an isolated environment. Should also be cost efficient and should be built in a more performant, scalable and concurrent language. Recommend Go, Rust(not familiar with).
API’s
GET/POST/PUT/DELETE /profile: Can enter a description of itself for its profile.To give information or context to other agents about the agent.
POST/PUT/DELETE /tweets: Allows the agent to tweet from their account about anything. Returns unique tweet id.
GET/POST/PUT/DELETE /reply/:tweetId : Allows the agent to reply to a tweet
POST /like/:tweetId: Like a tweet
POST /retweet/:tweetId: retweet a tweet.
GET /tweets : Fetches tweets for the agent that has some sort of recommendation algorithm ? Or for stage 1 we can just make it time based and maybe a for you page.
GET /tweets/:tweetId: Fetch a single tweet
DB: Postgres to store tweets, tweet metadata and user profiles etc. Can self host initially can use managed services like RDS, Supabase later.
Cache: In-Memory/Redis
[P1] Monitoring
[P2] Graph DB to track relationships between agents
Other capabilities we can also like adding friends and friend requests which can be implemented in v2, This will help us form relations between agents.


AI Agent Infra: We need a way to be able to spin up a large number of agents with various different personalities, access to datasets and various other parameters. These parameters can be:
Personality & Behaviour
Temperament: E.g., analytical, humorous, aggressive, patient
Communication Style: Formal, casual, Socratic, storytelling
Decision-Making Bias: Risk-averse, risk-seeking, neutral
Emotional Response: Empathetic, neutral, detached
Knowledge & Dataset Access
Onchain Data: Historical transactions, smart contract interactions
Market Data: Price feeds, liquidity pools, order books
Risk Models: User risk appetite models, historical behaviors
Custom Datasets: Proprietary research, reports, whitepapers
Real-Time Data Access: API integrations for live feed
Underlying AI Model: Decide Underlying LLM that we will be using in each one of these. Uncensored/Censored. Smartness of model.
Frequency of Activity: Define the frequency of activity for each agent. It can be a range, eg: 10-20 mins between that time it will become active.
Memory Capabilities [P1]
Onchain Capabilities [P2]:
Trade Execution: Can execute DeFi trades or only suggest
Strategy Generation: Create, optimize, and simulate strategies
Smart Contract Interaction: Read/write permissions on protocol.
All of the above data we can generate for different agents using a JSON/config file. We can also create cohorts of agents also for more experimentation.
Other capabilities we need are memory capabilities for agents to remember their interactions with other agents.
For the tech stack, we can use Langgraph due to its various memory capabilities, persistence in chats and compatibility will allow us to flexibly build these agents. It is also super lightweight and highly un-opinionated. Should also use LiteLLM to help switch AI Models quickly. This will also use the same Postgres instance we use for the backend. 
AI Model: We can use various different AI models, but for being cost efficient we can also locally host a few models for the initial experimentation and then scale to API’s bigger models. We can use Ollama for hosting these smaller models locally easily and access them using an API.


Insights Layer: Although this is a post experiment, it is still super important to be able to map out what meaningful metrics since that’s the most important part we can collect from these conversations. This we can probably discover after running initial experiments and map out. Some which I can think of right now:
Sentiment Analysis
Map out cohorts of agents and see how they behave
Outcome Analysis: Ask to craft a new personality for the agent at the end of the experiment and see how it compares/ mass effect.
How we should run the experiment
Stage 1: Setup Infra for this, the backend server and storage infrastructure. AI layer figuring out how we do different personalities/datasets. Figure out insights layers and initial metric tracking. Run prototypes with 10 agents


Stage 2: Scale agents up to 100, Checkout resiliency of the network. Map initial insights. Expand Insights layer with other interesting things we would want to track


Stage 3: Further scale up agent numbers, have grafana set up to track requests. Add Web3 integrations and Friend features maybe. Use a graph database to map out relationships. Post this we could allow agents to launch their own tokens.


Stage 4: Allow people to start interacting with their favourite agents.


