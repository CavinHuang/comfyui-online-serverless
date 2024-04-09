import mimetypes
import subprocess
import requests
import os
import shutil

github_key = os.environ.get('GITHUB_API_KEY')

def get_github_repo_stars(repo_url):
    if github_key is None:
        print('🔴🔴 no github api key provided!!')
    # Extracting the owner and repo name from the URL
    parts = repo_url.split("/")
    owner, repo = parts[-2], parts[-1]

    # GitHub API endpoint for fetching repo details
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    
    headers = {
        "Authorization": f"token {github_key}",  # Adding the authentication token to the request header
        "Accept": "application/vnd.github.v3+json"
    }

    # Making the authenticated request
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        # Extracting the number of stars
        repo_data = response.json()
        stars = repo_data.get("stargazers_count", 0)
        owner_avatar_url = repo_data['owner']['avatar_url']
        # image_url = get_first_image_url_from_readme(owner, repo)
        description = repo_data.get('description')
        if not description:
            # Fetch README content
            readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
            readme_info = requests.get(readme_url, headers=headers).json()
            readme_content = readme_info.get('content', '')
            readme_text = requests.get(readme_info['download_url']).text if 'download_url' in readme_info else ""
            paragraphs = readme_text.split('\n\n')
            # Keep only the first two paragraphs
            first_two_paragraphs = paragraphs[:2]
            description = '\n'.join(first_two_paragraphs)

        return {
            "stars": stars,
            "owner_avatar_url": owner_avatar_url,
            'description': description,
            # "image_url": image_url
        }
    else:
        print(f"Failed to retrieve repository data. Status Code: {response.status_code}")
        return {}
import base64
import re

def get_first_image_url_from_readme(owner, repo):
    # Construct the URL for the README API
    readme_api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    
    # Make a request to get the README
    readme_response = requests.get(readme_api_url)
    if readme_response.status_code == 200:
        readme_data = readme_response.json()
        # Decode the content from base64
        readme_content = base64.b64decode(readme_data['content']).decode('utf-8')
        
        # Use regular expressions to find image URLs in markdown and HTML <img> tags
        markdown_image_urls = re.findall(r'!\[.*?\]\((.*?)\)', readme_content)
        html_img_urls = re.findall(r'<img.*?src="(.*?\.(jpg|jpeg|png|gif|bmp|svg))".*?>', readme_content)
        
        # Combine the lists, maintaining order and removing duplicates
        all_image_urls = list(dict.fromkeys(markdown_image_urls + html_img_urls))
        
        if all_image_urls:
            return all_image_urls[0]  # Return the first image URL
        else:
            return "No image found in README"
    else:
        return "Error: Unable to fetch README information"

def clear_except_allowed_folder(path, allowedFolder):
    """
    Clears everything in the specified path except for the allowedFolder.
    
    :param path: Path to the directory to clear.
    :param allowedFolder: The name of the folder to keep.
    """
    # Make sure the path is a directory
    if not os.path.isdir(path):
        print(f"The provided path {path} is not a directory.")
        return

    # Iterate through items in the directory
    for item in os.listdir(path):
        item_path = os.path.join(path, item)
        # Check if the current item is the allowedFolder
        if item == allowedFolder:
            continue  # Skip the allowedFolder
        
        # If item is a directory, remove it and its contents
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
            print(f"Removed directory: {item_path}")
        # If item is a file, remove it
        else:
            os.remove(item_path)
            print(f"Removed file: {item_path}")

######v2
def get_repo_user_and_name(module_path):
    command = ['git', 'config', '--get', 'remote.origin.url']
    try:
        result = subprocess.run(command, cwd=module_path, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        repo_url = result.stdout.strip()

        # Match both HTTPS and SSH URLs
        match = re.search(r'(?:https?://github.com/|git@github.com:)([^/]+)/([^/.]+)', repo_url)
        if match:
            username, repo_name = match.groups()
            # Attempt to get the default branch name
            branch_command = ['git', 'rev-parse', '--abbrev-ref', 'HEAD']
            branch_result = subprocess.run(branch_command, cwd=module_path, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            main_branch = branch_result.stdout.strip()

            # Get the latest commit hash
            commit_command = ['git', 'rev-parse', 'HEAD']
            commit_result = subprocess.run(commit_command, cwd=module_path, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            latest_commit = commit_result.stdout.strip()

            return username, repo_name, main_branch, latest_commit
        else:
            return "Could not parse URL", ""
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}", ""
