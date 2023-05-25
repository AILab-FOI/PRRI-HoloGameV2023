from git import Repo
import os

def is_local_up_to_date(repo):
    diff = repo.head.commit.diff(None)
    return len(diff) == 0

def update_local_directory(repo):
    repo.remotes.origin.fetch()
    repo.heads[repo.active_branch.name].checkout()
    repo.head.reset(index=True, working_tree=True)

def check_local_directory(repo_path, repo_url):
    if not os.path.exists(repo_path):
        repo = Repo.clone_from(repo_url, repo_path)
        print("Lokalni direktorij je ažuriran.")
    else:
        repo = Repo(repo_path)
        if is_local_up_to_date(repo):
            print("Lokalni direktorij je ažuran.")
        else:
            update_local_directory(repo)
            print("Lokalni direktorij je ažuriran.")

repo_path = "/home/barica/PRRI-HoloGameV2023/"
repo_url = "https://github.com/AILab-FOI/PRRI-HoloGameV2023.git"

check_local_directory(repo_path, repo_url)