from dataclasses import dataclass
from enum import Enum
import subprocess
import logging
import time
from pathlib import Path
from typing import List, Optional
import asyncio

class DeployTarget(Enum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEMO = "demo"

@dataclass
class DeployConfig:
    target: DeployTarget
    update_chain_data: bool = True
    update_videos: bool = True
    check_blue_railroad: bool = True
    remote_host: str = "jmyles_justinholmescom@ssh.nyc1.nearlyfreespeech.net"
    remote_path: str = "justinholmes.com"

class Deployer:
    def __init__(self, config: DeployConfig):
        self.config = config
        self.logger = logging.getLogger("deployer")
    
    async def update_chain_data(self):
        """Update chain data from Optimism"""
        self.logger.info("Updating chain data...")
        await asyncio.create_subprocess_exec("npm", "run", "fetch-video-metadata")
        
    async def update_blue_railroad_videos(self):
        """Download any new Blue Railroad videos"""
        self.logger.info("Checking for new Blue Railroad videos...")
        await asyncio.create_subprocess_exec("npm", "run", "download-videos")

    async def build(self):
        """Build the site"""
        self.logger.info("Building site...")
        await asyncio.create_subprocess_exec("npm", "run", "build")

    async def deploy(self):
        """Deploy to remote server"""
        self.logger.info(f"Deploying to {self.config.target.value}...")
        cmd = [
            "rsync", "-vah", "--progress", "--delete",
            f"output/justinholmes.com.public.dist/",
            f"{self.config.remote_host}:{self.config.remote_path}"
        ]
        await asyncio.create_subprocess_exec(*cmd)

    async def run(self):
        """Run the full deployment process"""
        try:
            if self.config.update_chain_data:
                await self.update_chain_data()
            
            if self.config.update_videos:
                await self.update_blue_railroad_videos()
                
            await self.build()
            await self.deploy()
            
            self.logger.info("Deployment complete!")
            
        except Exception as e:
            self.logger.error(f"Deployment failed: {e}")
            raise

async def main():
    logging.basicConfig(level=logging.INFO)
    
    config = DeployConfig(
        target=DeployTarget.PRODUCTION,
        update_chain_data=True,
        update_videos=True
    )
    
    deployer = Deployer(config)
    await deployer.run()

if __name__ == "__main__":
    asyncio.run(main())