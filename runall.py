import os
import json
import sys
import multiprocessing
import subprocess

def checkdir():
    os.system(f'start /B start cmd.exe @cmd /k cd')


def client(proc_args: str):
    print('client1')
    d = str(proc_args).replace("\n", "").replace(' ', '')
    os.system(f'cd client && start /B start cmd.exe @cmd /k npm run dev -- {d}')


def tracker():
    print('tracker')
    d = str(data["tracker"]).replace("\n", "").replace(' ', '')
    os.system(f'cd tracker && start /B start cmd.exe @cmd /k npm run dev -- {d}')

def update_file(path, new_content):
    with open(path, 'w') as f:
        for line in new_content:
            f.write(line)

with open('makefiles/common_models.js') as common_models:
    lines = common_models.readlines()
    update_file('tracker/models/index.js', lines)
    update_file('client/models/index.js', lines)

with open('makefiles/setup.json') as config_file:
    data = json.load(config_file)
    tracker = multiprocessing.Process(target=tracker)
    tracker.run()
    if 'tracker' not in sys.argv:
        for client_args in data['clients']:
            cli = multiprocessing.Process(target=client, args=(str(client_args),))
            cli.run()


