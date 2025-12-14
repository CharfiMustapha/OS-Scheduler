TARGET = ordonnanceur

SRC = src
POL = policies
INC = include

SRCS = src/main.c src/scheduler.c src/file_reader.c src/colors.c \
       policies/preemptive_priority.c policies/fifo.c policies/round_robin.c \
       policies/multilevel.c policies/sjf.c policies/priority_nonpreemptive.c \
       policies/srtf.c

CC = gcc
CFLAGS = -I$(INC) -Wall -std=c99

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CC) $(CFLAGS) $(SRCS) -o $(TARGET)

clean:
	rm -f $(TARGET)