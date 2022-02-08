import os
import json
import multiprocessing


def checkdir():
    os.system(f'start /B start cmd.exe @cmd /k cd')


def client1():
    print('client1')
    d = str(data["client1"]).replace("\n", "").replace(' ', '')
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
    # print(data['tracker'])
    client1 = multiprocessing.Process(target=client1)
    tracker = multiprocessing.Process(target=tracker)

    client1.run()
    tracker.run()
#
# def main():
#     while 1:
#         usrin = input()
#         if usrin == 'r':
#             client1.kill()
#             client1.start()
#             tracker.kill()
#             tracker.start()
#
#         if usrin == 'e':
#             client1.kill()
#             tracker.kill()
#
# if __name__ == '__main__':
#     main()
