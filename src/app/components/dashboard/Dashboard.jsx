"use client"; 
 
import { useEffect, useState } from "react"; 
import { useRouter } from "next/navigation";
 
export default function Dashboard({ user }) { 
   const router = useRouter();
  const [repositories, setRepositories] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 


 
 
  useEffect(() => { 
    async function fetchRepositories() { 
      try { 
        const response = await fetch("/api/repositories"); 
 
        if (!response.ok) { 
          throw new Error("Failed to fetch repositories."); 
        } 
 
        const result = await response.json(); 
 
        setRepositories(result.data ?? []); 
      } catch (error) { 
        console.error(error); 
        setError("Unable to load repositories."); 
      } finally { 
        setLoading(false); 
      } 
    } 
 
    fetchRepositories(); 
  }, []); 



 
  return ( 
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10 "> 
      <div className="mx-auto w-full"> 
 
        {/* Header */} 
        <div className="mb-10"> 
          <h1 className="text-3xl font-bold"> 
            PRISM Dashboard 
          </h1> 
 
          <p className="text-gray-400 mt-2"> 
            Logged in as{" "} 
            <span className="text-white font-medium"> 
              {user.login} 
            </span> 
          </p> 
 
          <p className="text-gray-500 text-sm mt-1"> 
            {user.email ?? "Email not available"} 
          </p> 
        </div> 
 
        {/* Repositories */} 
        <section> 
          <h2 className="text-xl font-semibold mb-5"> 
            Your Repositories 
          </h2> 
 
          {loading && ( 
            <p className="text-gray-400"> 
              Loading repositories... 
            </p> 
          )} 
 
          {error && ( 
            <p className="text-red-400"> 
              {error} 
            </p> 
          )} 
 
          {!loading && !error && repositories.length === 0 && ( 
            <p className="text-gray-400"> 
              No repositories found. 
            </p> 
          )} 
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  mx-auto">
            {repositories.map((repo) => ( 
              <div
  key={repo.id}
  onClick={() =>
    router.push(`/dashboard/${repo.owner}/${repo.name}`)
  }
  className="border border-white/10 bg-white/[0.03] rounded-xl p-5 hover:border-white/20 transition cursor-pointer"
>
                <h3 className="font-semibold text-lg"> 
                  {repo.name} 
                </h3> 
 
                <p className="text-gray-500 text-sm mt-1"> 
                  {repo.owner} 
                </p> 
 
               <div className="flex gap-3 mt-5 text-sm"> 
  <span className="text-gray-400"> 
    {repo.language ?? "Unknown"} 
  </span> 
 
  <span className="text-gray-600">•</span> 
 
  <span 
    className={ 
      repo.visibility === "public" 
        ? "text-emerald-400" 
        : "text-yellow-400" 
    } 
  > 
    {repo.visibility} 
  </span> 
</div> 
              </div> 
            ))} 
          </div> 


  
        </section> 
 
      </div> 
    </main> 
  ); 
} 