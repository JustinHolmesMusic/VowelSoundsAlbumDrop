pipeline {
    agent any
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        parallelsAlwaysFailFast();
    }

    environment {
        NODE_VERSION = '23.6.1'
        NVM_DIR = '/var/jenkins_home/.nvm'
        ALCHEMY_API_KEY = credentials('ALCHEMY_API_KEY')
        DISCORD_BOT_TOKEN = credentials('DISCORD_BOT_TOKEN')
    }
    
    stages {
        stage('Setup Environment') {
            steps {
                sh '''
                    # Install NVM if not present
                    if [ ! -d "$NVM_DIR" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    fi
                '''
            }
        }
        
        stage('Setup NodeJS ${NODE_VERSION}') {
            steps {
                sh '''
                    export NVM_DIR="$NVM_DIR"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // Only install if node_modules doesn't exist or package.json changed
                sh '''
                    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}
                        npm install
                    fi
                '''
            }
        }

        stage('Tests and Fetches') {
            parallel {
                stage('Run Tests') {
                    steps {
                        sh '''
                    export NVM_DIR="$NVM_DIR"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    npm test
                '''
                    }
                }

                stage("Fetch Chain Data") {
                    steps {
                        sh '''
                            export NVM_DIR="$NVM_DIR"
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            nvm use ${NODE_VERSION}
                            npm run fetch-chain-data
                        '''
                    }
                }
                
                stage('Fetch Blue Railroads Metadata') {
                    steps {
                        sh '''
                            export NVM_DIR="$NVM_DIR"
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            nvm use ${NODE_VERSION}
                            npm run fetch-video-metadata
                        '''
                    }
                }

            }
        }

            stage('Download Blue Railroad Videos') {
                steps {
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}
                        npm run download-videos
                    '''
                }
            }

        stage("Build") {

            parallel {
                    
                stage('Build cryptograss.live') {
                    steps {
                        sh '''
                            export NVM_DIR="$NVM_DIR"
                            export SITE=cryptograss.live
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            nvm use ${NODE_VERSION}
                            npm run build
                        '''
                    }
                }

                stage('Build justinholmes.com') {
                    steps {
                        sh '''
                            export NVM_DIR="$NVM_DIR"
                            export SITE=justinholmes.com
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            nvm use ${NODE_VERSION}
                            npm run build
                        '''
                    }
                }
            }
        }
    


        stage('Deploy') {
            steps {
                sh '''
                    rsync -av output/justinholmes.com.public.dist/ /var/www/justinholmes.com/
                    rsync -av output/cryptograss.live.public.dist/ /var/www/cryptograss.live/
                '''
            }
        }
    }
    
}